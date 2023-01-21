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

(async () => {
    try {
        
        const index = parseInt(process.env.RECYCLE_CONTRACT_ID);

        let params = await algodClient.getTransactionParams().do();

        let appArgs = [];
        appArgs.push(new Uint8Array(Buffer.from("deposit")));
        // weight
        appArgs.push(algosdk.encodeUint64(10));
        //appArgs.push(new Uint8Array(Buffer.from("10")));
        // recycle level
        appArgs.push(algosdk.encodeUint64(1));
        //appArgs.push(new Uint8Array(Buffer.from("1")));


        // create unsigned transaction
        let txn = algosdk.makeApplicationCallTxnFromObject({
            from : sender, 
            suggestedParams : params, 
            appIndex : index, 
            appArgs : appArgs,
            foreignAssets : [parseInt(process.env.ECO_ID)],
            accounts : [process.env.USER_ADDRESS]
        })
        let txId = txn.txID().toString();

        // Sign the transaction
        let signedTxn = txn.signTxn(myaccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for transaction to be confirmed
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        // display results
        let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
        console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
        if (transactionResponse['global-state-delta'] !== undefined ) {
            console.log("Global State updated:", transactionResponse['global-state-delta']);
        }
        if (transactionResponse['local-state-delta'] !== undefined ) {
            console.log("Local State updated:", transactionResponse['local-state-delta']);
        }
        console.log("Txn summary: ");
        console.log(transactionResponse['txn']);

     
        
} catch (err) {
    console.error(err);
    process.exit(1);
  }
})()