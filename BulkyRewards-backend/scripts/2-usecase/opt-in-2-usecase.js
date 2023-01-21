import dotenv from "dotenv";
import algosdk from "algosdk";
import fs from 'fs'
import {
    open, readFile
  } from 'node:fs/promises';
import { type } from "node:os";
dotenv.config();

// Script to make stateless contract optin into asset, based on logic in the contract
const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = '';
const token = {
    'X-API-Key': process.env.API_KEY
}

const algodClient = new algosdk.Algodv2(token, baseServer, port);


(async () => {
    // get suggested parameters
    let params = await algodClient.getTransactionParams().do();
    params.fee = 1000;
    params.flatFee = true;
    console.log(params);
    
    // Read Teal file
    const data = fs.readFileSync("contracts/artifacts/2-usecase-escrow.teal");

    // Compile teal
    const results = await algodClient.compile(data).do();
    console.log("Hash = " + results.hash);
    console.log("Result = " + results.result);

    // let program = new Uint8Array(Buffer.from("base64-encoded-program" < PLACEHOLDER >, "base64"));
    let program = new Uint8Array(Buffer.from(results.result, "base64"));

    // Create Logig Sig
    let lsig = new algosdk.LogicSigAccount(program);
    console.log("lsig : " + lsig.address());   


    // create a transaction
    let sender = lsig.address();
    const assetID = parseInt(process.env.TCKT_ID);
    const note = undefined;
    const recipient = sender;
    const revocationTarget = undefined;
    const closeRemainderTo = undefined;

    //Amount of the asset to transfer
    const amount = 0;

    let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from : sender, 
        to : recipient, 
        suggestedParams : params,
        amount : amount,
        assetIndex : assetID,
        closeRemainderTo : closeRemainderTo, 
        revocationTarget : revocationTarget,
        note : note, 
    });


    // Create the LogicSigTransaction with contract account LogicSigAccount
    let rawSignedTxn = algosdk.signLogicSigTransactionObject(xtxn, lsig);
    // send raw LogicSigTransaction to network
    // fs.writeFileSync("simple.stxn", rawSignedTxn.blob);
    let tx = (await algodClient.sendRawTransaction(rawSignedTxn.blob).do());
    console.log("Transaction : " + tx.txId);   
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
})().catch(e => {
    console.log(e.message);
    console.log(e);
});

function getUint8Int(number) {
    const buffer = Buffer.alloc(8);
    const bigIntValue = BigInt(number);
    buffer.writeBigUInt64BE(bigIntValue);
    return  [Uint8Array.from(buffer)];
}