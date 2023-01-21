import dotenv from "dotenv";
import algosdk from "algosdk";
import fs from 'fs';

dotenv.config();

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = '';
const token = {
    'X-API-Key': process.env.API_KEY
}

const algodClient = new algosdk.Algodv2(token, baseServer, port); 

let userAccount = algosdk.mnemonicToSecretKey(process.env.USER_MNEMONIC);
let  userAddress = userAccount.addr;


const data = fs.readFileSync("contracts/artifacts/2-usecase-escrow.teal");

// Compile teal
const results = await algodClient.compile(data).do();
console.log("Hash = " + results.hash);
console.log("Result = " + results.result);

let program = new Uint8Array(Buffer.from(results.result, "base64"));
let lsig = new algosdk.LogicSigAccount(program);



(async () => {
    
        
    // Transfer New Asset
    let params = await algodClient.getTransactionParams().do();
    params.fee = 1000;
    params.flatFee = true;
    let assetID = parseInt(process.env.TCKT_ID);
    let note = undefined;
    let sender = lsig.address();
    let recipient = userAddress;
    let revocationTarget = undefined;
    let closeRemainderTo = undefined;
    //Amount of the asset to transfer
    let amount = 1;

    // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
    let xtxn1 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params
    );
    // Must be signed by the account sending the asset  
    //const rawSignedTxn = xtxn.signTxn(myaccount.sk)
    
    // Transfer New Asset
    assetID = parseInt(process.env.ECO_ID);
    sender = userAddress;
    recipient = process.env.ADMIN_ADDRESS;
    //Amount of the asset to transfer
    amount = 5;

    // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
    let xtxn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender, 
        recipient, 
        closeRemainderTo, 
        revocationTarget,
        amount,  
        note, 
        assetID, 
        params
    );

    let txns = [xtxn1, xtxn2];
    algosdk.assignGroupID(txns);
    let signedTxn1 = algosdk.signLogicSigTransactionObject(xtxn1, lsig);
    let signedTxn2 = xtxn2.signTxn(userAccount.sk);
    let signed = [];
    // for logic sig transaction we need to send thei .blob not the object
    signed.push(signedTxn1.blob);
    signed.push(signedTxn2);

  
    let tx = (await algodClient.sendRawTransaction(signed).do());

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    //Get the completed Transaction
    console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

})().catch(e => {
        console.log(e);
});