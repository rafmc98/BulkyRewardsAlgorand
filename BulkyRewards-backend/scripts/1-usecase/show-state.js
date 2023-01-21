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


// read local state of application from user account
async function readLocalState(client, account, index){
    let accountInfoResponse = await client.accountInformation(account.addr).do();
    for (let i = 0; i < accountInfoResponse['apps-local-state'].length; i++) { 
        if (accountInfoResponse['apps-local-state'][i].id == index) {
            console.log("User's local state:");
            for (let n = 0; n < accountInfoResponse['apps-local-state'][i][`key-value`].length; n++) {
                console.log(accountInfoResponse['apps-local-state'][i][`key-value`][n]);
            }
        }
    }
}


async function readGlobalState(client, account, index){
    try {
        let accountInfoResponse = await client.accountInformation(account.addr).do();
        for (let i = 0; i < accountInfoResponse['created-apps'].length; i++) { 
            if (accountInfoResponse['created-apps'][i].id == index) {
                console.log("Application's global state:");
                console.log(accountInfoResponse['created-apps'][i]['params']['global-state'])
                for (let n = 0; n < accountInfoResponse['created-apps'][i]['params']['global-state'].length; n++) {
                    const gs = accountInfoResponse['created-apps'][i]['params']['global-state'][n]
                    console.log("Key: " + Buffer.from(gs.key, "base64").toString());
                    let indirizzo = atob(gs.value.bytes);
                    const byteArray = new Uint8Array(indirizzo.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
                    console.log(algosdk.encodeAddress(byteArray));
                }
            }
        }    
    } catch (err) {
        console.log(err);
    }
    
}

const algodClient = new algosdk.Algodv2(token, baseServer, port); 

let myaccount = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
let sender = myaccount.addr;

const index = parseInt(process.env.RECYCLE_CONTRACT_ID);

readLocalState(algodClient, myaccount, index);
readGlobalState(algodClient, myaccount, index);

console.log("Application addr " + algosdk.getApplicationAddress(index));