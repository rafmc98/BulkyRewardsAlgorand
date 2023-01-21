import dotenv from "dotenv";
import algosdk from "algosdk";
import {
    open, readFile
  } from 'node:fs/promises';
import { type } from "node:os";
dotenv.config();

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = '';
const token = {
    'X-API-Key': process.env.API_KEY
}

const algodClient = new algosdk.Algodv2(token, baseServer, port); 

let myaccount = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
let sender = myaccount.addr;

// helper function to compile program source  
async function compileProgram(client, TealSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(TealSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledBytes;
}

function getUint8Int(number) {
    const buffer = Buffer.alloc(8);
    const bigIntValue = BigInt(number);
    buffer.writeBigUInt64BE(bigIntValue);
    return  [Uint8Array.from(buffer)];
}

(async () => {
    try {
        // declare application state storage
        const localInts = 1      // to store the user recycle value
        const localBytes = 0
        const globalInts = 6     // to store the total recycle value
        const globalBytes = 1    // to store the creator address

        const approvalProgramfile = await open('contracts/artifacts/1-usecase-approval.teal');
        const clearProgramfile = await open('contracts/artifacts/1-usecase-clear.teal');

        const approvalProgram = await approvalProgramfile.readFile();
        const clearProgram = await clearProgramfile.readFile();

        const approvalProgramBinary = await compileProgram(algodClient, approvalProgram);
        const clearProgramBinary = await compileProgram(algodClient, clearProgram);

        let params = await algodClient.getTransactionParams().do();
        const onComplete = algosdk.OnApplicationComplete.NoOpOC;
        
        console.log("Deploying Application. . . . ");

        let txn = algosdk.makeApplicationCreateTxn(
            sender, 
            params, 
            onComplete, 
            approvalProgramBinary, 
            clearProgramBinary, 
            localInts, 
            localBytes, 
            globalInts, 
            globalBytes
        );
        let txId = txn.txID().toString();

        // Sign the transaction
        let signedTxn = txn.signTxn(myaccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        await algosdk.waitForConfirmation(algodClient, txId, 2);

        // print the app-id
        let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
        let appId = transactionResponse['application-index'];
        console.log("Created new with app-id: ",appId);
        console.log("Application Address: ", algosdk.getApplicationAddress(appId));
        
} catch (err) {
    console.error("Failed to deploy!", err);
    process.exit(1);
  }
})()
