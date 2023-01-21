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



// Function used to print created asset for account and assetid
const printCreatedAsset = async function (algodclient, account, assetid) {
    let accountInfo = await algodclient.accountInformation(account).do();
    for (let idx = 0; idx < accountInfo['created-assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['created-assets'][idx];
        if (scrutinizedAsset['index'] == assetid) {
            console.log("AssetID = " + scrutinizedAsset['index']);
            let myparms = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
            console.log("parms = " + myparms);
            break;
        }
    }
};

// Create asset 
let params = await algodclient.getTransactionParams().do();
let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored

let addr = sender;
// Whether user accounts will need to be unfrozen before transacting    
let defaultFrozen = false;
// integer number of decimals for asset unit calculation
let decimals = 0;
// total number of this asset available for circulation   
let totalIssuance = 100000;
// Used to display asset units to user    
let unitName = "TRAN";
// Friendly name of the asset    
let assetName = "TransportAsset";
// Optional string pointing to a URL relating to the asset
let assetURL = "http://bulkyRewards.com";
// Optional hash commitment of some sort relating to the asset. 32 character length.
let assetMetadataHash = "16efaa3924a6fd9d3a4824799a4ac65d";
// The following parameters are the only ones
// that can be changed, and they have to be changed
// by the current manager
// Specified address can change reserve, freeze, clawback, and manager
let manager = sender;
// Specified address is considered the asset reserve
// (it has no special privileges, this is only informational)
let reserve = sender;
// Specified address can freeze or unfreeze user asset holdings 
let freeze = sender;
// Specified address can revoke user asset holdings and send 
// them to other addresses    
let clawback = sender;

// signing and sending "txn" allows "addr" to create an asset
let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
    addr, 
    note,
    totalIssuance, 
    decimals, 
    defaultFrozen, 
    manager, 
    reserve, 
    freeze,
    clawback, 
    unitName, 
    assetName, 
    assetURL, 
    assetMetadataHash, 
    params
);

let rawSignedTxn = txn.signTxn(myaccount.sk)
let tx = (await algodclient.sendRawTransaction(rawSignedTxn).do());

let assetID = null;
// wait for transaction to be confirmed
const ptx = await algosdk.waitForConfirmation(algodclient, tx.txId, 4);
// Get the new asset's information from the creator account
assetID = ptx["asset-index"];

console.log("Asset ID : " + assetID);
//Get the completed Transaction
console.log("Transaction " + tx.txId + " confirmed in round " + ptx["confirmed-round"]);
