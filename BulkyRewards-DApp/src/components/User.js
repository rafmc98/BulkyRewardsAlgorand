import React, { useEffect, useState } from 'react';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import dotenv from "dotenv";
import statelessContract from '../contracts/2-usecase';
import escrowAppApproval from '../contracts/3-usecase-approval';
import escrowApplicationClear from '../contracts/3-usecase-clear';
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import approvedLogo from '../approvedLogo.webp';
import rejectedLogo from '../rejectedLogo.png';
import optinLogo from '../optinLogo.jpg';
import exchangeLogo from '../exchangeLogo.jpg';
import escrowLogo from '../escrowLogo.jpg';
import ecoLogo from '../ecoLogo.png';
import transportLogo from '../transportLogo.png';
import ticketLogo from '../ticketLogo.png';
import algoLogo from '../algoLogo.png';
import exchangeLogo2 from '../exchangeLogo2.png';
import escrowLogo2 from  '../escrowLogo2.png';
import sadSmile from '../sadsmile.svg';
import claimLogo from '../claimLogo.png';
import peraLogo from '../peraLogo.jpg';


dotenv.config();

const User = () => {
    const [currentAccount, setCurrentAccount] = useState();
    const [walletBalance, setWalletBalance] = useState([]);
    const [connector, setConnector] = useState();
    const [connected, setConnected] = useState(false);
    const [onExchange, setOnExchange] = useState(false);
    const [onEscrow, setOnEscrow] = useState(false);
    const [onOptin, setOnOptin] = useState(false);
    const [showTxnResponse, setShowTxnResponse] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [createdApps, setCreatedApps] = useState([]); 
    const [responseMessage, setResponseMessage] = useState("");
    const [responseFlag, setResponseFlag] = useState(true);
    const [escrowPassword, setEscrowPassword] = useState();
    const [escrowReceiver, setEscrowReceiver] = useState();
    const [currentAppIndex, setCurrentAppIndex] = useState();
    const [onAppSummary, setOnAppSummary] = useState(false);
    const [appSummaryReceiver, setAppSummaryReceiver] = useState();
    const [appSummaryTimeout, setAppSummaryTimeout] = useState();
    const [escrowContractMessage, setEscrowContractMessage] = useState("");
    const [showInfoBox, setShowInfoBox] = useState(false);
    const [appSummaryId, setAppSummaryId] = useState();
    const [claimFlag, setClaimFlag] = useState(false);


    const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const indexer_server = "https://testnet-algorand.api.purestake.io/idx2";
    const port = '';
    const token = {
      'X-API-Key': "CW6TU6sWYz5GfcNS1a8Wn3Ez71s2EHjv4RiudnR7"
    }
    const indexerClient = new algosdk.Indexer(token, indexer_server, port);
    const algodClient = new algosdk.Algodv2(token, baseServer, port);

    const ecoAsa = 153409788;
    const tranAsa = 153411159;
    const tcktAsa = 153411062;

    const assetIdList = {
        "EcoAsset" : ecoAsa,
        "TransportAsset" : tranAsa,
        "TicketAsset" : tcktAsa
    };

    const assetLogoList = {
        "EcoAsset" : ecoLogo,
        "TransportAsset" : transportLogo,
        "TicketAsset" : ticketLogo
    };

    const receiverAddresses = [
        { zone : "zone 1", address: "RQ2GGDXGM7O3TUI6O6N7IPL5KFKYIZKO3FRLZEPOXGJLUIVU6YRZREMMUA"},
        { zone : "zone 2", address: "XIIEQ4ID673ATSDSSUMXNRV2XDITJ6HUXRZSX4J5SKKBQIZSW5GZBHGPX4"}
    ]

    const checkIfWalletIsConnected = async () => {
        try {
          if (!connector.connected) {
            console.log("No connection");
            return;
          } else {
            console.log("We have connection", connector);
          }
          const { accounts } = connector;
          if (accounts.length !== 0) {
            const account = accounts[0];
            console.log("Found an authorized account:", account);
            setCurrentAccount(account);
            // await getAllRecs(); IMPORTANT FOR FUNCTIONALITY LATER
          } else {
            setCurrentAccount();
            console.log("No authorized account found")
          }
        } catch (error) {
          console.log(error);
        }
    };

    const disconnectWallet = async () => {
        connector.killSession();
        console.log("Killing session for wallet with address: ", currentAccount);
        setCurrentAccount();
        setConnector();
        setConnected(false);

        // reset to defalt values 
        setOnExchange(false);
        setOnOptin(false);
        setOnEscrow(false);
        setOnAppSummary(false);
    };
    
    const connectWallet = async () => {
        try {
          const bridge = "https://bridge.walletconnect.org";
          const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
          setConnector(connector);
    
          if (!connector.connected) {
            await connector.createSession();
            console.log("Creating new connector session");
          }
          connector.on("connect", (error, payload) => {
            if (error) {
              throw error;
            }
            // Get provided accounts
            const { accounts } = payload.params[0];
            console.log("connector.on connect: Connected an account with address:", accounts[0]);
            setCurrentAccount(accounts[0]);
            setConnector(connector);
            setConnected(true);
          });
          connector.on("session_update", (error, payload) => {
            if (error) {
              throw error;
            }
            // Get updated accounts 
            const { accounts } = payload.params[0];
            setCurrentAccount(accounts[0]);
          });
          connector.on("disconnect", (error, payload) => {
            if (error) {
              throw error;
            }
            setCurrentAccount();
            setConnected(false);
            setConnector();
          });
          if (connector.connected) {
            const { accounts } = connector;
            const account = accounts[0];
            setCurrentAccount(account);
            setConnected(true);
          }
        } catch (error) {
          console.log("something didn't work in creating connector", error);
        }
    };

    const showOperation = async () => {
        setOnEscrow(false);
        setOnExchange(false);
        setOnOptin(false);
        setOnAppSummary(false);
    };

    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    };
      
    const getBalances = async () => {
        if (currentAccount){
            let accountInfo = await algodClient.accountInformation(currentAccount).do(); 
            let tempAsaList = [];
            tempAsaList.push({amount : accountInfo['amount'] / 1000000, id: 1, name : "Algo", logo : algoLogo});
            for (let idx = 0; idx < accountInfo['assets'].length; idx++) {
                let scrutinizedAsset = accountInfo['assets'][idx];
                if (Object.values(assetIdList).includes(scrutinizedAsset['asset-id'])) {
                    let asaName = getKeyByValue(assetIdList, scrutinizedAsset['asset-id']);
                    let asaLogo = assetLogoList[asaName];
                    scrutinizedAsset["name"] = asaName; 
                    scrutinizedAsset["logo"] = asaLogo; 
                    tempAsaList.push(scrutinizedAsset);
                    let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
                    //console.log(myassetholding);
                }
            }
            setWalletBalance(tempAsaList);
        } 
    };

    const renderOwnedAsa = walletBalance.map((asaInfo) => 
        <tr key = {asaInfo["name"]}>
            <td><img className='asa-logo' src={asaInfo["logo"]} alt={asaInfo["name"]}/></td>
            <td name="name">{asaInfo["name"]}</td>
            <td>{asaInfo["amount"]}</td> 
        </tr>
    );

    const getCreatedApps = async () => {
        if (currentAccount){
            let accountInfo = await algodClient.accountInformation(currentAccount).do();
            let tempAppList = [];
            for (let idx = 0; idx < accountInfo['created-apps'].length; idx++) {
                let scrutinizedApp = accountInfo['created-apps'][idx];
                // fai il check se l'app è presente nel sistema
                    tempAppList.push(scrutinizedApp);
                }
            setCreatedApps(tempAppList);
            //console.log(tempAppList);
            //console.log(JSON.stringify(accountInfo, undefined, 2));
        }
    };

    const getAppSummary = async (appId) => {
        setAppSummaryId(appId);
        setAppSummaryTimeout();
        setAppSummaryReceiver();
        showOperation();
        setOnAppSummary(true);
        let applicationInfoResponse = await algodClient.getApplicationByID(appId).do();
        let globalState = [];
        globalState = applicationInfoResponse['params']['global-state'];
        let receiver = null;
        let timeout = null;
        for (let n = 0; n < globalState.length; n++) {
            let key = atob(globalState[n]['key']);
            if (key === "Receiver"){
                let value = atob(globalState[n]['value']['bytes']);
                const byteAddr = new Uint8Array(value.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
                receiver = algosdk.encodeAddress(byteAddr);
            } else {
                if(key === "timeout") {
                    let value = globalState[n]['value']['uint'];
                    timeout = value;
                }
            }
            if (receiver !== null && timeout !== null) {
                setAppSummaryReceiver(receiver);
                setAppSummaryTimeout(timeout);
                checkContractStatus(timeout);
            }
        }
    };

    const renderOwnedApps = createdApps.map((appInfo) => 
        <div className='app-item' key={appInfo["id"]}>
            <span onClick={() => getAppSummary(appInfo["id"])}>{appInfo["id"]}</span>
        </div>
    );

    const receiverOptions = receiverAddresses.map((el) => {
        return <option key={el["zone"]} value={el["address"]}>
                    {el["zone"]}
                </option>
    });

    const userEscrowClaim = async () => {
        try {
            let index = appSummaryId;

            let params = await algodClient.getTransactionParams().do();

            let appArgs = [];
            // Define the operation
            appArgs.push(new Uint8Array(Buffer.from("owner_claim")));
    
            // create unsigned transaction
            let txn = algosdk.makeApplicationCallTxnFromObject({
                from : currentAccount, 
                suggestedParams : params, 
                appIndex : index, 
                appArgs : appArgs,
                foreignAssets : [tranAsa]
            })
            let txId = txn.txID().toString();
    
            setShowOverlay(true);
            setShowInfoBox(true);
            // time to sign . . . which we have to do with walletconnect api
            const txns = [txn]
            const txnsToSign = txns.map(txn => {
            const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                return {
                    txn: encodedTxn,
                };
            });
            const requestParams = [txnsToSign];
            const request = formatJsonRpcRequest("algo_signTxn", requestParams);
            const result = await connector.sendCustomRequest(request);
            // have to go on phone and accept the transaction
            const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
            setShowInfoBox(false);
         
            // Submit the transaction
            await algodClient.sendRawTransaction(decodedResult).do();
    
           // Wait for transaction to be confirmed
           await algosdk.waitForConfirmation(algodClient, txId, 4);
           setShowTxnResponse(true);

           let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();

           console.log("Transaction response : ", transactionResponse['txn']);

           setResponseFlag(true);
           setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
       } catch(err) {
           setShowOverlay(true);
           setShowTxnResponse(true);
           setResponseFlag(false);
           setResponseMessage(err['message'])
           console.log("Transaction error : ", err);
       }
    };

    const renderEscrowSummary = <>
        <p className='operationTitle'>Escrow app summary</p>
        {(appSummaryReceiver && appSummaryTimeout) && (
            <>
                <img className='escrowLogo2' src={escrowLogo2} alt='escrowLogo2'/>
                <p>Application Id</p>
                <span className='default-message'>{appSummaryId}</span>
                <p>Receiver address</p>
                <input type="text" className="default-input" value={appSummaryReceiver} readOnly/> 
                <p>Timeout</p>
                <input type="text" className="default-input" value={appSummaryTimeout} readOnly/>
                <div className='default-message-box'>
                    {escrowContractMessage}
                </div>
                {claimFlag && (
                    <button className='default-button' onClick={userEscrowClaim}>Claim TransportAsset</button>
                )}
            </>
        )}
        {(!appSummaryReceiver || !appSummaryTimeout) && (
            <>
                <img name='sadSmile' src={sadSmile} alt='sadSmile'/>
                <div className='default-message-box'>
                    This is not an escrow contract
                </div>
            </>
        )}
    </>;    
       
    const checkContractStatus = async (timeout) => {
        try {
            let currencyGreater = 10;
            let limit = 1;
            let transactionInfo = await indexerClient.searchForTransactions()
                .currencyGreaterThan(currencyGreater)
                .limit(limit).do();
            //console.log("Information for Transaction search: " + JSON.stringify(transactionInfo, undefined, 4));
            let currentRound = parseInt(transactionInfo["current-round"]);
            if (currentRound > timeout){
                setEscrowContractMessage("The escrow period has expired, if the collection has not taken place you can recover your payment");
                setClaimFlag(true);
            } else {
                setEscrowContractMessage("Awaiting the collection of bulky waste");
                setClaimFlag(false);
            }
        } catch (error) {
            console.log(error);
            console.trace();
        }
    };

    const asaExchange = async (asaName) => {
        try {

            const data = statelessContract;
            // Compile teal
            const results = await algodClient.compile(data).do();
            console.log("Hash = " + results.hash);

            let program = new Uint8Array(Buffer.from(results.result, "base64"));
            let lsig = new algosdk.LogicSigAccount(program);

            let asaToReceive = 0;
            let amountToSend = 0;

            if (asaName === "tran") {
                asaToReceive = tranAsa;
                amountToSend = 50;
            } else { 
                if (asaName === "tckt" ) {
                    asaToReceive = tcktAsa;
                    amountToSend = 5;
                }
            }
            // Transfer New Asset
            let params = await algodClient.getTransactionParams().do();
            params.fee = 1000;
            params.flatFee = true;
         
            // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
            let xtxn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                from : lsig.address(),
                to : currentAccount, 
                closeRemainderTo : undefined, 
                revocationTarget : undefined, 
                amount : 1, 
                note : undefined, 
                assetIndex: asaToReceive, 
                suggestedParams : params
            });

            // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
            let xtxn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                from : currentAccount,
                to : "XIIEQ4ID673ATSDSSUMXNRV2XDITJ6HUXRZSX4J5SKKBQIZSW5GZBHGPX4", 
                closeRemainderTo : undefined, 
                revocationTarget : undefined, 
                amount : amountToSend, 
                note : undefined, 
                assetIndex: ecoAsa, 
                suggestedParams : params
            });

            
            let txns = [xtxn1, xtxn2];              
            algosdk.assignGroupID(txns);    
            let signedTxn1 = algosdk.signLogicSigTransactionObject(xtxn1, lsig);
            
            setShowOverlay(true);
            setShowInfoBox(true);
            // time to sign . . . which we have to do with walletconnect api
            const txnsToSign = txns.map((txn) => {
                const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                if (algosdk.encodeAddress(txn.from.publicKey) !== currentAccount)
                    return {
                        txn: encodedTxn,
                        signers: []
                    };
                return {
                    txn: encodedTxn
                };
            });
            const requestParams = [txnsToSign];
            const request = formatJsonRpcRequest("algo_signTxn", requestParams);
            const result = await connector.sendCustomRequest(request); 
            // have to go on phone and accept the transaction
            const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
            setShowInfoBox(false);
            let signedTxn2 = decodedResult[0];
            
            let signed = [];
            // for logic sig transaction we need to send thei .blob not the object
            signed.push(signedTxn1.blob);
            signed.push(signedTxn2);

            let tx = (await algodClient.sendRawTransaction(signed).do());
            
            let txId = tx["txId"];  

            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);

            // print the app-id
            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();

            console.log("Transaction response : ", transactionResponse['txn']);

            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
       
        } catch(err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.log("Transaction error : ", err['message']);
        }    
    }; 

    const closeBox = async () => {
        setShowOverlay(false);
        setShowTxnResponse(false);
    };

    const optIn = async (asaName) => {
        try {
            // The user do optin to the asset
            const params = await algodClient.getTransactionParams().do();
            const sender = currentAccount;
            let assetID = null;
            if (asaName === "tran") { assetID = tranAsa; }
            if (asaName === "eco") { assetID = ecoAsa; }
            if (asaName === "tckt") { assetID = tcktAsa; }      
            const note = undefined;
            const recipient = sender;
            const revocationTarget = undefined;
            const closeRemainderTo = undefined;
            //Amount of the asset to transfer
            const amount = 0;

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
        
            let txId = xtxn.txID().toString();
                
            
            setShowOverlay(true);
            setShowInfoBox(true);
            // time to sign . . . which we have to do with walletconnect api
            const txns = [xtxn]
            const txnsToSign = txns.map(txn => {
            const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                return {
                    txn: encodedTxn,
                };
            });
            const requestParams = [txnsToSign];
            const request = formatJsonRpcRequest("algo_signTxn", requestParams);
            const result = await connector.sendCustomRequest(request);
            // have to go on phone and accept the transaction
            const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
            setShowInfoBox(false);

            await algodClient.sendRawTransaction(decodedResult).do();

            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);

            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();

            console.log("Transaction response : ", transactionResponse['txn']);

            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
        } catch(err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.log("Transaction error : ", err);
        }
    };

    const onEscrowPasswordChange = event => {
        setEscrowPassword(event.target.value);
        console.log('escrow passcode is: ', event.target.value);
    };

    const onEscrowReceiverChange = event => {
        setEscrowReceiver(event.target.value);
        console.log('escrow receiver address is: ', event.target.value);
    };

    async function compileProgram(client, TealSource) {
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(TealSource);
        let compileResponse = await client.compile(programBytes).do();
        let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
        return compiledBytes;
    };

    const deployApp = async () => {
        try {
            // declare application state storage
            const localInts = 0      
            const localBytes = 0
            const globalInts = 1   
            const globalBytes = 3    // to store the creator address, the receiver address and secret passcode
    
            const approvalProgramBinary = await compileProgram(algodClient, escrowAppApproval);
            const clearProgramBinary = await compileProgram(algodClient, escrowApplicationClear);

            let params = await algodClient.getTransactionParams().do();
            const onComplete = algosdk.OnApplicationComplete.NoOpOC;

            console.log("Deploying Application. . . . ");

            let sender = currentAccount;
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


            setShowOverlay(true);
            setShowInfoBox(true);
            // time to sign . . . which we have to do with walletconnect api
            const txns = [txn]
            const txnsToSign = txns.map(txn => {
            const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                return {
                    txn: encodedTxn,
                };
            });
            const requestParams = [txnsToSign];
            const request = formatJsonRpcRequest("algo_signTxn", requestParams);
            const result = await connector.sendCustomRequest(request);
            // have to go on phone and accept the transaction
            const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
            setShowInfoBox(false);

            // Submit the transaction
            await algodClient.sendRawTransaction(decodedResult).do();

            
            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);

            // print the app-id
            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
            let appId = transactionResponse['application-index'];
            console.log("Created new with app-id: ", appId);
            console.log("Application Address: ", algosdk.getApplicationAddress(appId));
            console.log("Transaction response : ", transactionResponse['txn']);
            
            setCurrentAppIndex(appId);
            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + 
                                "\nConfirmed in round " + transactionResponse["confirmed-round"] + 
                                "\nCreated new with app-id: " + appId +
                                "\nApplication Address: " + algosdk.getApplicationAddress(appId)
                            );
        } catch(err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.log("Transaction error : ", err);
        }
    };

    const sendFund = async () => {
        try {
            console.log("opt-in to asa and sending fund");
            const index = currentAppIndex;
    
            let params = await algodClient.getTransactionParams().do();
    
            let applicationAddress = algosdk.getApplicationAddress(index);

            // check the minimun
            let txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                from : currentAccount,
                suggestedParams : params,
                amount : 1000000,
                to : applicationAddress
            });

            let appArgs = [];
            // define the operation the contract has to do
            appArgs.push(new Uint8Array(Buffer.from("contract_setup")));
            // the user define the passcode for escrow contract
            appArgs.push(new Uint8Array(Buffer.from(escrowPassword)));
        
            let txn2 = algosdk.makeApplicationCallTxnFromObject({
                from : currentAccount,
                suggestedParams : params,
                appIndex : index,
                appArgs : appArgs,
                accounts : [escrowReceiver]
            })

            appArgs = [];
            appArgs.push(new Uint8Array(Buffer.from("optin_asa")));

            let txn3 = algosdk.makeApplicationCallTxnFromObject({
                from : currentAccount, 
                suggestedParams : params, 
                appIndex : index, 
                appArgs : appArgs,
                foreignAssets : [tranAsa]
            })

            // Transfer 1 TRAN to Application
            const assetID = tranAsa;
            const note = undefined;
            const recipient = applicationAddress;
            const revocationTarget = undefined;
            const closeRemainderTo = undefined;
            //Amount of the asset to transfer
            const amount = 1;

            // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
            let txn4 = algosdk.makeAssetTransferTxnWithSuggestedParams(
                currentAccount, 
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
                
            setShowOverlay(true);
            setShowInfoBox(true);
            // time to sign . . . which we have to do with walletconnect api
            const txnsToSign = txns.map((txn) => {
                const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                return {
                    txn: encodedTxn
                };
            });
            const requestParams = [txnsToSign];
            const request = formatJsonRpcRequest("algo_signTxn", requestParams);
            const result = await connector.sendCustomRequest(request);
            // have to go on phone and accept the transaction
            const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
            setShowInfoBox(false);

            let signed = decodedResult;

            let tx = (await algodClient.sendRawTransaction(signed).do());
            let txId = tx["txId"];

           
            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);

             // print the app-id
             let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();

             setResponseFlag(true);
             setResponseMessage("Transaction " + txId + 
                                 "\nConfirmed in round " + transactionResponse["confirmed-round"]
                                );

            setCurrentAppIndex();

        } catch(err) {
            console.log(err);
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.log("Transaction error : ", err);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        getBalances();
        getCreatedApps();
      }, [currentAccount, onExchange, onOptin, onAppSummary, showOverlay, showTxnResponse, responseMessage, currentAppIndex, appSummaryTimeout, appSummaryReceiver, escrowContractMessage]);
    return (
        <>
            {showOverlay && (
                <div className='overlay'>
                    {showInfoBox && (
                        <div className='txn-response-box'>
                           <div className='transaction-approved-box'>
                                <img className='opLogo' src={peraLogo} alt="peraLogo" />
                                <div className='info-msg'>Please approve<br/>the transaction <br/>from your wallet</div>
                            </div>
                        </div> 
                    )}
                    {!showTxnResponse && (
                        <div className="loading">
                            <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                        </div>
                    )}
                    {showTxnResponse && (
                        <div className='txn-response-box'>
                            <span className='close-box' onClick={closeBox}>x</span>
                            {responseFlag && (
                                <div className='transaction-approved-box'>
                                    <img name='approve' src={approvedLogo} alt='response'/>
                                    <span className='show-message'>{responseMessage}</span>
                                </div>
                            )}
                            {!responseFlag  && (
                                <div className='transaction-rejected-box'>
                                    <img name='reject' src={rejectedLogo} alt='response'/>
                                    <span className='show-message'>{responseMessage}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className='user-container'>

                {(onEscrow || onExchange || onOptin || onAppSummary) && (
                    <button className='return-btn' onClick={showOperation}> &#60; return to operations</button>
                )}

                {!currentAccount && (
                    <div className="connect-wallet-container">
                        <img src='https://1000logos.net/wp-content/uploads/2022/05/WalletConnect-Logo.png' alt=''/>
                        <div className="connect-text">
                            Please connect your wallet clicking the button below
                        </div>
                        <button className="default-button" onClick={connectWallet}>
                            Connect Wallet
                        </button>
                    </div>
                )}

                {(currentAccount && !onExchange && !onOptin && !onEscrow && !onAppSummary) && (
                    <>
                    <div className="operations-container">
                        <div onClick={() => setOnOptin(current => !current)}>
                            <img className='opLogo' src={ecoLogo} alt='ecoLogo'/>
                            Asa Opt-in
                        </div>
                        <div onClick={() => setOnExchange(current => !current)}>
                            <img className='opLogo' src={exchangeLogo2} alt='tranExchange'/>
                            Asa Exchange
                        </div>
                        <div onClick={() => setOnEscrow(current => !current)}> 
                            <img className='opLogo' src={escrowLogo2} alt='escrowLogo'/>
                            Request Home Pick-up
                        </div>
                    </div>
                    </>
                )}

                {onExchange && (
                    <>
                    <div className='default-box'>
                        <p className='operationTitle'>Asset exchange</p>
                        <img className='exchangeLogo' src={exchangeLogo} alt='exchange' />
                        <div className='default-message-box'>
                            By clicking on one of the available buttons, you can swap assets at the displayed exchange rates shown below
                            <br/>
                            <br/>
                            <b>50 Eco = 1 Tran</b>
                            <br/>
                            <b>5 Eco = 1 Tckt</b>
                            <br/>
                        </div>
                        <div className='button-box'>
                            <button className='row-button' onClick={() => asaExchange("tran")}>TRAN exchange</button>
                            <button className='row-button' onClick={() => asaExchange("tckt")}>TCKT exchange</button>    
                        </div>
                    </div>
                    </>
                )}

                {onEscrow && (
                    <div className='default-box'>
                        {!currentAppIndex && (
                            <>
                                <p className='operationTitle'>Create escrow contract</p>
                                <img className='escrowLogo' src={escrowLogo} alt='escrowLogo'/>
                                <div className='default-message-box'>
                                    In this section, you can create an escrow contract 
                                    to request the collection of your bulky waste from your home. 
                                    To do so, you can specify a 'password' that the transporter will 
                                    use to take their payment from the contract. You can also specify 
                                    the zone relative to your residential address, so that the order is 
                                    assigned to the transporter operating in your area. The contract will expire after one week. 
                                    If the collection has not taken place by then, 
                                    you can recover your payment through the appropriate section.
                                </div>
                                Escrow password
                                <input type="text" className='default-input' value={escrowPassword} onChange={onEscrowPasswordChange} />
                                Pick-up zone
                                <select type="text" className='default-input' value={escrowReceiver} onChange={onEscrowReceiverChange} >
                                    <option value="">please select a pick-up zone</option>
                                    {receiverOptions}
                                </select>
                                <button className='default-button' onClick={deployApp}>Create app</button>
                            </>
                        )}
                        {currentAppIndex && (
                            <>
                                <p className='operationTitle'>Send funds to escrow contract</p>
                                    <div className='default-message-box'>
                                        To make the contract active, you must send 1 Algo 
                                        to the newly created contract so that it has the funds 
                                        to handle the necessary transactions. In addition, with 
                                        the following transaction you will send the transporter's 
                                        payment, corresponding to 1 TRAN, to the contract
                                    </div>
                                <button className='default-button' onClick={sendFund}>Send funds</button>
                            </>
                        )}
                    </div>

                )}

                {onOptin && (
                    <div className='default-box'>
                        <p className='operationTitle'>Asa opt-in</p>
                        <img className='optinLogo' src={optinLogo} alt=''/>
                        <div className='default-message-box'>
                            To receive an Algorand asset, you must explicitly “opt-in” 
                            to receive the asset by sending a 0 amount of the asset to yourself
                            Click the button below to send an Opt in transaction
                        </div>
                        <div className='button-box'>
                            <button className='row-button' onClick={() => optIn("eco")}>Eco opt-in</button>
                            <button className='row-button' onClick={() => optIn("tran")}>Tran opt-in</button>
                            <button className='row-button' onClick={() => optIn("tckt")}>Tckt opt-in</button>
                        </div>
                    </div>
                )}

                {onAppSummary && (
                    <div className='default-box'>
                        {renderEscrowSummary}
                    </div>
                )}

                {currentAccount && (
                    <div className='info-box'>
            
                        <p>User address</p>
                        <span className='user-addr'>{currentAccount}</span>

                        <p>Assets</p>
                        <table className='info-table'>
                            <tbody>
                                {renderOwnedAsa}
                            </tbody>
                        </table>

                        <p>Created Apps</p>
                        <div className='app-box'>
                            {renderOwnedApps}
                        </div>
                    
                        <button className='disconnect-wallet-btn' onClick={disconnectWallet}>disconnect wallet</button>
                    </div>
                )}
                
            </div>
        </>    
    );
}

export default User;