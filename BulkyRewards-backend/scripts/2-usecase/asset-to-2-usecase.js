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

let myaccount = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
let sender = myaccount.addr;

// Function used to print asset holding for account and assetid
const printAssetHolding = async function (algodclient, account, assetid) {
    let accountInfo = await algodclient.accountInformation(account).do();
    for (let idx = 0; idx < accountInfo['assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['assets'][idx];
        if (scrutinizedAsset['asset-id'] == assetid) {
            let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
            console.log("assetholdinginfo = " + myassetholding);
            break;
        }
    }
};

// Transfer New Asset
const params = await algodclient.getTransactionParams().do();
const assetID = parseInt(process.env.TCKT_ID);
const note = undefined;
const recipient = process.env.EXCHANGE_CONTRACT_ADDRESS;
const revocationTarget = undefined;
const closeRemainderTo = undefined;
//Amount of the asset to transfer
const amount = 100;

// signing and sending "txn" will send "amount" assets from "sender" to "recipient"
let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    sender, 
    recipient, 
    closeRemainderTo, 
    revocationTarget,
    amount,  
    note, 
    assetID, 
    params);
// Must be signed by the account sending the asset  
const rawSignedTxn = xtxn.signTxn(myaccount.sk)
let xtx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

// Wait for confirmation
const confirmedTxn = await algosdk.waitForConfirmation(algodclient, xtx.txId, 4);
//Get the completed Transaction
console.log("Transaction " + xtx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

// You should now see the 10 assets listed in the account information
console.log("Receiver address = " + recipient);
await printAssetHolding(algodclient, recipient, assetID);
