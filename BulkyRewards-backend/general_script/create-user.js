import algosdk from "algosdk";
import dotenv from "dotenv";
dotenv.config();


const myaccount = algosdk.generateAccount();
console.log("Account Address = " + myaccount.addr);
let account_mnemonic = algosdk.secretKeyToMnemonic(myaccount.sk);
console.log("Account Mnemonic = "+ account_mnemonic);
