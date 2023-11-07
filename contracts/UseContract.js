require('dotenv/config');
const { ethers } = require('ethers');
const { Alchemy, Network, Wallet, Utils } = require("alchemy-sdk");
const { RPC_URL, CHAIN_ID } = require('../utils/constants');
const { API_KEY, PRIVATE_KEY } = process.env;

let wallet = new Wallet(PRIVATE_KEY);

provider = new ethers.providers.JsonRpcProvider(RPC_URL)


/**
 * トランザクションを送信するメソッド
 * @param abi コントラクトのABI
 * @param address コントラクトのアドレス
 * @param functionName ファクション名
 * @param args ファクションの引数
 * @param rpc_url 任意のAPI RPC エンドポイント
 * @param chainId チェーンID
 * @return 送信結果
 */
const sendTx = async(abi, address, functionName, args, rpc_url, chainId) => {
    // contract interface
    try {
        
    var contract = new ethers.utils.Interface(abi);
    // crate contract function data
    var func = contract.encodeFunctionData(functionName, args);
    
    wallet.connect(provider);
    const addre = await wallet.getAddress();
   
    // get nonce
    var nonce = await provider.getTransactionCount(addre, 'pending') ;
    var gasLimit = functionName === 'createWallet' ? 2100000 : 210000;
    // create tx data
    var tx = {
        gasPrice: 300000000000,
        gasLimit,
        data: func,
        to: address,
        nonce: nonce,
        chainId: CHAIN_ID
    }
    // sign tx
    var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));
        const res = await provider.sendTransaction(signedTransaction);
        console.log("Tx send result:", res);
       
    } catch(e) {
        console.log(e)
     
        return false;
    }

    return true;
}

/**
 * 複数のトランザクションを一括で処理するメソッド
 * @param txs トランザクションデータの配列
 * @return 送信結果
 */
const sendBatchTx = async(txs) => {
    // get tx count
    const count = txs.length;
    // Array for signedTx
    const signedTxs = [];

    try {
    for(var i = 0; i < count; i++) {
        // contract interface
        var contract = new ethers.utils.Interface(txs[i][0]);
        // crate contract function data
        var func = contract.encodeFunctionData(txs[i][2], txs[i][3]);
        // conncet provider
        wallet.connect(provider);
        // get nonce
        var nonce = await provider.getTransactionCount(await wallet.getAddress(),'pending') + i;
        // create tx data
        var tx = {
            gasPrice: 30000000000,
            gasLimit: 185000,
            data: func,
            to: txs[i][1],
            nonce: nonce,
            chainId: CHAIN_ID
        }
        // sign tx
        var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));
   
        // push
        signedTxs.push(signedTransaction);
    }

        // send tx
        var res;
        
        for(var i = 0; i< count; i++) {
            res = await provider.sendTransaction(signedTxs[i]);
    
        }
    } catch(e) {
        console.log("Tx send error:", e);
        return false;
    }

    return true;
};

/**
 * 送金処理のみのトランザクションメソッド
 * @param to 送金先アドレス
 * @param value 送金額
 * @param rpc_url 任意のAPI RPC エンドポイント
 * @param chainId チェーンID
 * @return 送信結果
 */
const sendEth = async(to, value, rpc_url, chainId) => {

    try {
    
    // conncet provider
    wallet.connect(provider);
    // get nonce
    var nonce = await provider.getTransactionCount(await wallet.getAddress(),'pending');

    // create tx data
    var tx = {
        gasPrice:250000000000,
        gasLimit:210000,
        to: to,
        nonce: nonce,
        chainId: CHAIN_ID,
        value: new ethers.utils.parseEther(value.toString())
    }
    // sign tx
    var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));

    
        // send tx
        const res = await provider.sendTransaction(signedTransaction);
      console.log("Tx send result:", res);
    } catch(e) {
        console.log("Tx send error:", e);
        return false;
    }

    return true;
}


module.exports = { 
    
    sendTx,
    sendBatchTx, 
    sendEth,
    wallet,
    provider
};