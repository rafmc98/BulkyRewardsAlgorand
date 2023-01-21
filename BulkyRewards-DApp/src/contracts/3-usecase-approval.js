const escrowAppApproval = `#pragma version 6
txn ApplicationID
int 0
==
bnz main_l16
txn OnCompletion
int DeleteApplication
==
bnz main_l15
txn OnCompletion
int UpdateApplication
==
bnz main_l14
txn OnCompletion
int NoOp
==
bnz main_l5
err
main_l5:
txna ApplicationArgs 0
byte "optin_asa"
==
bnz main_l13
txna ApplicationArgs 0
byte "contract_setup"
==
bnz main_l12
txna ApplicationArgs 0
byte "owner_claim"
==
bnz main_l11
txna ApplicationArgs 0
byte "receiver_claim"
==
bnz main_l10
err
main_l10:
txn Sender
byte "Receiver"
app_global_get
==
byte "passcode"
app_global_get
txna ApplicationArgs 1
sha256
==
&&
assert
callsub sendasa_1
int 1
return
main_l11:
txn Sender
byte "Creator"
app_global_get
==
byte "timeout"
app_global_get
txn FirstValid
<=
&&
assert
callsub sendasa_1
int 1
return
main_l12:
txn Sender
byte "Creator"
app_global_get
==
txn NumAppArgs
int 2
==
&&
assert
byte "passcode"
txna ApplicationArgs 1
sha256
app_global_put
byte "timeout"
txn FirstValid
int 1000
+
app_global_put
byte "Receiver"
txna Accounts 1
app_global_put
int 1
return
main_l13:
callsub optinasa_0
int 1
return
main_l14:
txn Sender
byte "Creator"
app_global_get
==
return
main_l15:
txn Sender
byte "Creator"
app_global_get
==
return
main_l16:
byte "Creator"
txn Sender
app_global_put
int 1
return

// optin_asa
optinasa_0:
itxn_begin
int axfer
itxn_field TypeEnum
txna Assets 0
itxn_field XferAsset
int 0
itxn_field AssetAmount
global CurrentApplicationAddress
itxn_field AssetReceiver
itxn_submit
retsub

// send_asa
sendasa_1:
itxn_begin
int axfer
itxn_field TypeEnum
txna Assets 0
itxn_field XferAsset
int 1
itxn_field AssetAmount
txn Sender
itxn_field AssetReceiver
itxn_submit
retsub`;

export default escrowAppApproval;