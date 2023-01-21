import dotenv from "dotenv";
import algosdk from "algosdk";
import {
    open, readFile
  } from 'node:fs/promises';
import { type } from "node:os";
import { sign } from "node:crypto";
dotenv.config();

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = '';
const token = {
    'X-API-Key': process.env.API_KEY
}

const algodClient = new algosdk.Algodv2(token, baseServer, port); 

let myaccount = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
let sender = myaccount.addr;

try {

console.log("opt-in to asa and sending fund");
const index = parseInt(process.env.ESCROW_CONTRACT_ID);

let params = await algodClient.getTransactionParams().do();

let applicationAddress = algosdk.getApplicationAddress(index);

// check the minimun
let txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from : sender,
    suggestedParams : params,
    amount : 1000000,
    to : applicationAddress
});

let appArgs = [];
appArgs.push(new Uint8Array(Buffer.from("contract_setup")));
 // the user define the passcode for escrow contract
appArgs.push(new Uint8Array(Buffer.from("marco")));

let txn2 = algosdk.makeApplicationCallTxnFromObject({
    from : sender,
    suggestedParams : params,
    appIndex : index,
    appArgs : appArgs,
    accounts : [process.env.ADMIN_ADDRESS]
})

appArgs = [];
appArgs.push(new Uint8Array(Buffer.from("optin_asa")));

let txn3 = algosdk.makeApplicationCallTxnFromObject({
    from : sender, 
    suggestedParams : params, 
    appIndex : index, 
    appArgs : appArgs,
    foreignAssets : [parseInt(process.env.TRAN_ID)]
})

// Transfer 1 TRAN to Application
const assetID = parseInt(process.env.TRAN_ID);
const note = undefined;
const recipient = applicationAddress;
const revocationTarget = undefined;
const closeRemainderTo = undefined;
//Amount of the asset to transfer
const amount = 1;

// signing and sending "txn" will send "amount" assets from "sender" to "recipient"
let txn4 = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender, 
    recipient, 
    closeRemainderTo, 
    revocationTarget,
    amount,  
    note, 
    assetID, 
    params
);

let txns = [txn1, txn2, txn3, txn4];
algosdk.assignGroupID(txns);
    
let signedTxn1 = txn1.signTxn(myaccount.sk);
let signedTxn2 = txn2.signTxn(myaccount.sk);
let signedTxn3 = txn3.signTxn(myaccount.sk);
let signedTxn4 = txn4.signTxn(myaccount.sk);

let signed = [];
signed.push(signedTxn1);
signed.push(signedTxn2);
signed.push(signedTxn3);
signed.push(signedTxn4);

let tx = (await algodClient.sendRawTransaction(signed).do());
let txId = tx["txId"];

// Wait for transaction to be confirmed
await algosdk.waitForConfirmation(algodClient, txId, 4);

 // print the app-id
 let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();

//Get the completed Transaction
console.log("Transaction " + tx.txId + " confirmed in round " + transactionResponse["confirmed-round"]);

} catch(err) {
console.log(err);
}