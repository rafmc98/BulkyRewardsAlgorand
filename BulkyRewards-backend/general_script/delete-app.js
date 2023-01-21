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

const algodclient = new algosdk.Algodv2(token, baseServer, port); 

let myaccount = algosdk.mnemonicToSecretKey(process.env.ACCOUNT_MNEMONIC);
let sender = myaccount.addr;

try {
    let appIndexList = []

    // get node suggested parameters
    let params = await algodclient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;

    for (let idx = 0; idx < appIndexList.length; idx++) {

        console.log(appIndexList[idx]);
        // create unsigned transaction
        let index = appIndexList[idx];
        let txn = algosdk.makeApplicationDeleteTxn(sender, params, index);

        let txId = txn.txID().toString();

        // Sign the transaction
        let signedTxn = txn.signTxn(myaccount.sk);
        //console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await algodclient.sendRawTransaction(signedTxn).do();

        // Wait for transaction to be confirmed
        await algosdk.waitForConfirmation(algodclient, txId, 4);
        
        // display results
        let transactionResponse = await algodclient.pendingTransactionInformation(txId).do();
        let appId = transactionResponse['txn']['txn'].apid;
        console.log("Deleted app-id: ",appId);
    }
        

} catch (err) {
    console.log(err);
}
