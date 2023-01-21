import React, { useEffect, useState } from 'react';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { QrReader } from 'react-qr-reader';
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import statelessContract from '../contracts/2-usecase';
import approvedLogo from '../approvedLogo.webp';
import rejectedLogo from '../rejectedLogo.png';
import depositLogo from '../depositLogo.png';
import ecoLogo from '../ecoLogo.png';
import transportLogo from '../transportLogo.png';
import ticketLogo from '../ticketLogo.png';
import claimLogo from '../claimLogo.png';
import algoLogo from '../algoLogo.png';
import contractLogo from '../contractLogo.svg';
import fundsToContractLogo from '../fundsToContractLogo.jpg';
import ecoToContractLogo from '../ecoToContractLogo.jpg';
import disposalLogo from '../disposalLogo.jpg';
import escrowClaimLogo from '../escrowClaimLogo.jpg';
import peraLogo from '../peraLogo.jpg';



const Admin = () => {

    const depositAppIndex = 153411402;
    
    const ecoAsa = 153409788;
    const tranAsa = 153411159;
    const tcktAsa = 153411062;

    const [currentAccount, setCurrentAccount] = useState();
    const [connector, setConnector] = useState();
    const [connected, setConnected] = useState(false);
    const [onDeposit, setOnDeposit] = useState(false);
    const [onReceiverClaim, setOnReceiverClaim] = useState(false);
    const [onManageContracts, setOnManageContracts] = useState(false);
    const [weight, setWeight] = useState(0);
    const [currentReward, setCurrentReward] = useState(0);
    const [recycleLevel, setRecycleLevel] = useState(1);
    const [appIndex, setAppIndex] = useState();
    const [appPassword, setAppPassword] = useState();
    const [showOverlay, setShowOverlay] = useState(false);
    const [showTxnResponse, setShowTxnResponse] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");
    const [appGlobalStatus, setAppGlobalStatus] = useState([]);
    const [responseFlag, setResponseFlag] = useState(true);
    const [scanResultWebCam, setScanResultWebCam] =  useState('No result');
    const [onScanning, setOnScanning] = useState(false);
    const [appAsaBalance, setAppAsaBalance] = useState([]);
    const [exchangeContractBalance, setExchangeContractBalance] = useState([]);
    const [onFundRecycleApp, setOnFundRecycleApp] = useState(false);
    const [onFundExchangeContract, setOnFundExchangeContract] = useState(false);
    const [onRetrieveFunds, setOnRetrieveFunds] = useState(false);
    const [recycleAppAmount, setRecycleAppAmount] = useState(1);
    const [exchangeContractAmount, setExchangeContractAmount] = useState(1);
    const [asaToSend, setAsaToSend] = useState(tcktAsa);
    const [showInfoBox, setShowInfoBox] = useState(false);
    

    
    const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
    const port = '';
    const token = {
      'X-API-Key': "CW6TU6sWYz5GfcNS1a8Wn3Ez71s2EHjv4RiudnR7"
    };
    const algodClient = new algosdk.Algodv2(token, baseServer, port);

    const statusMap = new Map([
        ["level_1", "Level 1"],
        ["level_2", "Level 2"],
        ["level_3", "Level 3"],
        ["level_4", "Level 4"],
        ["level_5", "Level 5"],
        ["tot_recycle_counter", "Total"]
    ]);

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

      // reset default values
      setOnDeposit(false);
      setOnReceiverClaim(false);
      setOnManageContracts(false);
      setOnRetrieveFunds(false);
      setOnFundExchangeContract(false);
      setOnFundRecycleApp(false);
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
          setCurrentAccount(accounts[0]);
          console.log(connected);
        });
        connector.on("session_update", (error, payload) => {
          if (error) {
            throw error;
          }
          // Get updated accounts 
          const { accounts } = payload.params[0];
          setCurrentAccount(accounts[0])
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
  
    const deposit = async () => {
      try {
        
        // construct transaction
        let params = await algodClient.getTransactionParams().do();
  
        let sender = currentAccount;
  
        let appArgs = [];
        appArgs.push(new Uint8Array(Buffer.from("deposit")));

        // weight
        appArgs.push(algosdk.encodeUint64(parseInt(weight)));
        // recycle level
        appArgs.push(algosdk.encodeUint64(parseInt(recycleLevel)));

        let userAddress = scanResultWebCam.toString();
  
        // create unsigned transaction
        let txn = algosdk.makeApplicationCallTxnFromObject({
          from: sender,
          suggestedParams: params,
          appIndex: depositAppIndex,
          appArgs: appArgs,
          foreignAssets: [ecoAsa],
          accounts: [userAddress]
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
        
        console.log("Transaction response : ", transactionResponse);

        setResponseFlag(true);
        setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
        
        console.log("Called app-id:", transactionResponse['txn']['txn']['apid']);
        if (transactionResponse['global-state-delta'] !== undefined) {
          await getAppStatus();
        }
      } catch (err) {
        setShowOverlay(true);
        setShowTxnResponse(true);
        setResponseFlag(false);
        setResponseMessage(err['message'])
        console.error(err['message'])
        console.error("Transaction error : ", err);
      }
    };

    const receiverClaim = async () => {
        try {
            const index = parseInt(appIndex);
        
            let params = await algodClient.getTransactionParams().do();
    
            let appArgs = [];
            // Define the operation
            appArgs.push(new Uint8Array(Buffer.from("receiver_claim")));
    
            // Define the passcode to unlock the TRAN on the escrow contract
            appArgs.push(new Uint8Array(Buffer.from(appPassword)));
    
    
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
            
            // display results
            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
            console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
            console.log("Transaction response : ", transactionResponse['txn']);
            
            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
           
        } catch (err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.log("Transaction error : ", err);
        }
    }
  
    const getAppStatus = async () => {
        if (currentAccount){
            let tempList = new Map();
            let applicationInfoResponse = await algodClient.getApplicationByID(depositAppIndex).do();
            let globalState = []
            globalState = applicationInfoResponse['params']['global-state'];
            for (let n = 0; n < globalState.length; n++) {
                let key =  atob(globalState[n]['key']);
                if (key !== "Creator") {
                    tempList.set(statusMap.get(key), globalState[n]['value']['uint']);
                }
            }
            let orderedList = [];
            orderedList.push({"name" : "Level 1", "value" : tempList.get("Level 1")});
            orderedList.push({"name" : "Level 2", "value" : tempList.get("Level 2")});
            orderedList.push({"name" : "Level 3", "value" : tempList.get("Level 3")});
            orderedList.push({"name" : "Level 4", "value" : tempList.get("Level 4")});
            orderedList.push({"name" : "Level 5", "value" : tempList.get("Level 5")});
            orderedList.push({"name" : "Total", "value" : tempList.get("Total")});
            setAppGlobalStatus(orderedList);
        }
    };

    const renderAppStatus = appGlobalStatus.map((state) => 
        <tr key = {state["name"]} >
            <td name="name">{state["name"]}</td>
            <td>{state["value"]}</td> 
        </tr>
    );

    function getKeyByValue(object, value) {
        return Object.keys(object).find(key => object[key] === value);
    };

    const getAppAsaBalance = async () => {
        if (currentAccount){
            let appAddress = algosdk.getApplicationAddress(depositAppIndex);
            let accountInfo = await algodClient.accountInformation(appAddress).do(); 
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
                }
            }
            setAppAsaBalance(tempAsaList);
        } 
    };

    const renderAppAsaBalance = appAsaBalance.map((asaInfo) => 
        <tr key = {asaInfo["name"]} >
            <td><img className='asa-logo' src={asaInfo["logo"]} alt={asaInfo["name"]}/></td>
            <td name="name">{asaInfo["name"]}</td>
            <td>{asaInfo["amount"]}</td> 
        </tr>
    );

    const getExchangeContractBalance = async () => {
        if (currentAccount){
            // Compile teal
            const results = await algodClient.compile(statelessContract).do();
            let contractAddress = results.hash;
            console.log(contractAddress);
            let accountInfo = await algodClient.accountInformation(contractAddress).do(); 
            console.log(accountInfo);
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
                }
            }
            setExchangeContractBalance(tempAsaList);
        } 
    };

    const renderExchangeContractBalance = exchangeContractBalance.map((asaInfo) => 
        <tr key = {asaInfo["name"]} >
            <td><img className='asa-logo' src={asaInfo["logo"]} alt={asaInfo["name"]}/></td>
            <td name="name">{asaInfo["name"]}</td>
            <td>{asaInfo["amount"]}</td> 
        </tr>
    );

    const onWeightChange = event => {
      setWeight(event.target.value);
    };
  
    const onRecycleLevelChange = event => {
      setRecycleLevel(event.target.value);
    };

    const onAppIndexChange = event => {
        setAppIndex(event.target.value);
    };

    const onAppPasswordChange = event => {
        setAppPassword(event.target.value);
    };

    const onRecycleAppAmountChange = event => {
        setRecycleAppAmount(event.target.value);
    };

    const onExchangeContractAmountChange = event => {
        setExchangeContractAmount(event.target.value);
    };

    const onAsaToSendChange = event => {
        setAsaToSend(event.target.value);
    };

    const closeBox = async () => {
        setShowOverlay(false);
        setShowTxnResponse(false);
    };

    const reward = async () => {
        if (weight > 0 && weight <= 10) setCurrentReward(1 * recycleLevel);
        if (weight >= 11 && weight <= 50) setCurrentReward(2* recycleLevel);
        if (weight >= 51 && weight <= 100) setCurrentReward(3 * recycleLevel);
        if (weight >= 101 && weight <= 200) setCurrentReward(4 * recycleLevel);
        if (weight >= 201) setCurrentReward(5 * recycleLevel);
    };

    const showOperation = async () => {
        setOnDeposit(false);
        setOnReceiverClaim(false);
        setOnManageContracts(false);
        setOnRetrieveFunds(false);
        setOnFundExchangeContract(false);
        setOnFundRecycleApp(false);
    };

    const fundRecycleApp = async () => {
        try {
            const params = await algodClient.getTransactionParams().do();
            
            const appAddress = algosdk.getApplicationAddress(depositAppIndex);

            const assetID = ecoAsa;
            const note = undefined;
            const recipient = appAddress;
            const revocationTarget = undefined;
            const closeRemainderTo = undefined;
            //Amount of the asset to transfer
            const amount = parseInt(recycleAppAmount);
        
            // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
            let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
                currentAccount, 
                recipient, 
                closeRemainderTo, 
                revocationTarget,
                amount,  
                note, 
                assetID, 
                params
            );
           
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
        
            // Submit the transaction
            await algodClient.sendRawTransaction(decodedResult).do();
        
           
            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);
            
            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
            
            console.log("Transaction response : ", transactionResponse);
    
            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);

        } catch (err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.error(err['message'])
            console.error("Transaction error : ", err);
        }
    };

    const fundExchangeContract = async () => {
        try {
            
            const results = await algodClient.compile(statelessContract).do();
            let contractAddress = results.hash;

            const params = await algodClient.getTransactionParams().do();
            
            const assetID = parseInt(asaToSend);
            const note = undefined;
            const recipient = contractAddress;
            const revocationTarget = undefined;
            const closeRemainderTo = undefined;
            //Amount of the asset to transfer
            const amount = parseInt(exchangeContractAmount);
        
            // signing and sending "txn" will send "amount" assets from "sender" to "recipient"
            let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
                currentAccount, 
                recipient, 
                closeRemainderTo, 
                revocationTarget,
                amount,  
                note, 
                assetID, 
                params
            );
           
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
        
            // Submit the transaction
            await algodClient.sendRawTransaction(decodedResult).do();
        
            
            // Wait for transaction to be confirmed
            await algosdk.waitForConfirmation(algodClient, txId, 4);
            setShowTxnResponse(true);
            
            let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
            
            console.log("Transaction response : ", transactionResponse);
    
            setResponseFlag(true);
            setResponseMessage("Transaction " + txId + " confirmed in round " + transactionResponse["confirmed-round"]);
                
        } catch (err) {
            setShowOverlay(true);
            setShowTxnResponse(true);
            setResponseFlag(false);
            setResponseMessage(err['message'])
            console.error(err['message'])
            console.error("Transaction error : ", err);
        }
    }

   

    useEffect(() => {
        checkIfWalletIsConnected();
        getAppStatus();
        getAppAsaBalance();
        getExchangeContractBalance();
        reward();
    }, [currentAccount, onDeposit, onReceiverClaim, onManageContracts, onFundExchangeContract, onFundRecycleApp, onRetrieveFunds, weight, recycleLevel, showOverlay, scanResultWebCam, exchangeContractAmount, exchangeContractAmount])
    return (
        <>
            {showOverlay && (
                <div className='overlay'>
                    { !showTxnResponse && (
                        <div className="loading">
                            <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                        </div>
                    )}
                    {showInfoBox && (
                        <div className='txn-response-box'>
                           <div className='transaction-approved-box'>
                                <img className='opLogo' src={peraLogo} alt="peraLogo" />
                                <div className='info-msg'>Please approve<br/>the transaction <br/>from your wallet</div>
                            </div>
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

            <div className='admin-container'>

                {(onDeposit || onReceiverClaim || onManageContracts) && (
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
                
                {(currentAccount && !onDeposit && !onReceiverClaim && !onManageContracts) && (
                    
                    <div className="operations-container">
                        <div onClick={() => setOnDeposit(current => !current)}>
                        <img src={depositLogo} alt='depositLogo'/>
                            Disposal
                        </div>
                        <div onClick={() => setOnReceiverClaim(current => !current)}>
                            <img className='opLogo' src={claimLogo} alt='claimLogo'/>
                            Escrow claim
                        </div>
                        <div onClick={() => setOnManageContracts(current => !current)}>
                            <img className='opLogo' src={contractLogo} alt='contractLogo'/>
                            Manage contracts
                        </div>
                    </div>
                    
                )}

                {onDeposit && (
                    <div className='default-box'>
                        <p className='operationTitle'>Recycle bulky waste</p>
                        <img className='disposalLogo' src={disposalLogo} alt=''/>
                        <div className='default-message-box'>
                            Enter the weight and recycling level (1 to 5) 
                            of the delivered bulky waste, and scan the user's 
                            address, ensuring that he/she has opted-in to the ECO asset
                        </div>
                        <p>Scan user address</p>
                        <div className='open-scan-box'>
                            <div>{scanResultWebCam}</div>
                            <button className='open-scan-button' onClick={() => setOnScanning(current => !current)}>Scan QR</button>
                        </div>
                        {onScanning && (
                                <>
                                    <QrReader 
                                        className='scanBox' 
                                        onResult={(result, error) => {
                                            if (!!result) {
                                                setScanResultWebCam(result?.text);
                                            }
                                            if (!!error) {
                                                console.info(error);
                                            }
                                        }}
                                    />
                                </>
                            )}
                        <p>Insert weight</p>
                        <input className='default-input' type="number" value={weight} onChange={onWeightChange} />
                        <p>Select recycle level</p>
                        <select className='default-input' value={recycleLevel} onChange={onRecycleLevelChange}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                        </select>
                        <p>The user will receive : {currentReward} Ecos</p>
                        
                        <button className='default-button' onClick={deposit}>Send Transaction</button>
                    </div>
                )}

                {onReceiverClaim && (
                    <div className='default-box'>
                        <p className='operationTitle'>Escrow contract claim</p>
                        <img className='escrowClaimLogo' src={escrowClaimLogo} alt=""/>
                        <div className='default-message-box'>
                            In this section you can claim the payment 
                            for the door-to-door collection of bulky waste
                        </div>
                        <p>App index</p>
                        <input className='default-input' onChange={onAppIndexChange}/>
                        <p>Escrow password</p>
                        <input className='default-input' onChange={onAppPasswordChange}/>
                        <button className='default-button' onClick={receiverClaim}>Claim</button>
                    </div>
                )}

                {(onManageContracts && !onFundRecycleApp && !onFundExchangeContract && !onRetrieveFunds) && (
                    <div className='manage-contract-container'>
                        <span  onClick={() => setOnFundRecycleApp(current => !current)}>
                            Funds recycle app
                        </span>
                        <span  onClick={() => setOnFundExchangeContract(current => !current)}>
                            Funds exchange contract
                        </span>
                    </div>
                )}
                
                {onFundRecycleApp && (
                    <div className='default-box'>
                        <p className='operationTitle'>Eco to recycle contract</p>
                        <img className='ecoToContractLogo' src={ecoToContractLogo} alt=''/>
                        <div className='default-message-box'>
                            Send ECOs to supply the recycling contract
                        </div> 
                        <p>Insert amount</p>
                        <input className='default-input' type="number" value={recycleAppAmount} onChange={onRecycleAppAmountChange} />
                        <button className='default-button' onClick={fundRecycleApp}>Send Transaction</button>
                    </div>
                )}

                {onFundExchangeContract && (
                    <div className='default-box'>
                        <p className='operationTitle'>Funds to exchange contract</p>
                        <img className='fundsToContractLogo' src={fundsToContractLogo} alt=''/>
                        <div className='default-message-box'>
                            Send Transport Assets to supply the Exchange Contract
                        </div> 
                        <p>Insert amount</p>
                        <input className='default-input' type="number" value={exchangeContractAmount} onChange={onExchangeContractAmountChange} />
                        <p>Select the asa to send</p>
                        <select className='default-input' value={asaToSend} onChange={onAsaToSendChange}>
                            <option value={tcktAsa}>TicketAsset</option>
                            <option value={tranAsa}>TransportAsset</option>
                        </select>
                        <button className='default-button' onClick={fundExchangeContract}>Send Transaction</button>
                    </div>
                )}

                {currentAccount && (
                    <div className='info-box'>
            
                        <p>Admin address</p>
                        <span className='user-addr'>
                            {currentAccount}
                        </span>

                        <p>Recycle app status</p>
                        <table className='info-table'>
                            <tbody>
                                {renderAppStatus}
                            </tbody>
                        </table>
                        <p>Recycle app balance</p>
                        <table className='info-table'>
                            <tbody>
                                {renderAppAsaBalance}
                            </tbody>
                        </table>
                        <p className='exchangeAppTitle'>Exchange contract balance</p>
                        <table className='info-table'>
                            <tbody>
                                {renderExchangeContractBalance} 
                            </tbody>
                        </table>
                        <button className='disconnect-wallet-btn' onClick={disconnectWallet}>disconnect wallet</button>
                    </div>
                )}

            </div>
        </>
    );
}

    export default Admin;