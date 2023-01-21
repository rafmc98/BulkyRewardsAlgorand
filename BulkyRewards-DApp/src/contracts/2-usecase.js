const statelessContract = `#pragma version 2
global GroupSize
int 2
==
bnz main_l2
txn TypeEnum
int axfer
==
txn AssetAmount
int 0
==
&&
txn Sender
txn AssetReceiver
==
&&
txn XferAsset
int 153411159
==
txn XferAsset
int 153411062
==
||
&&
b main_l3
main_l2:
gtxn 0 AssetReceiver
gtxn 1 Sender
==
gtxn 0 TypeEnum
int axfer
==
&&
gtxn 0 Fee
int 1000
<=
&&
gtxn 0 AssetCloseTo
global ZeroAddress
==
&&
gtxn 0 AssetSender
global ZeroAddress
==
&&
gtxn 1 TypeEnum
int axfer
==
&&
gtxn 1 AssetReceiver
addr XIIEQ4ID673ATSDSSUMXNRV2XDITJ6HUXRZSX4J5SKKBQIZSW5GZBHGPX4
==
&&
gtxn 1 AssetCloseTo
global ZeroAddress
==
&&
gtxn 1 AssetSender
global ZeroAddress
==
&&
gtxn 1 Fee
int 1000
<=
&&
gtxn 0 XferAsset
int 153411159
==
gtxn 0 AssetAmount
int 1
==
&&
gtxn 1 XferAsset
int 153409788
==
&&
gtxn 1 AssetAmount
int 50
==
&&
gtxn 0 XferAsset
int 153411062
==
gtxn 0 AssetAmount
int 1
==
&&
gtxn 1 XferAsset
int 153409788
==
&&
gtxn 1 AssetAmount
int 5
==
&&
||
&&
main_l3:
return`;


export default statelessContract;