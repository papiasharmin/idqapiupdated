require('dotenv/config');
const { ethers } = require('ethers');
//const { KmsEthersSigner } = require('aws-kms-ethers-signer');
//const log4js = require('log4js');
//const {  REGION_ID } = require('../utils/constants');
// log4jsの設定
//log4js.configure('./log/log4js_setting.json');
//const logger = log4js.getLogger("server");
const { Alchemy, Network, Wallet, Utils } = require("alchemy-sdk");
const { RPC_URL, CHAIN_ID } = require('../utils/constants');
//const { AwsKmsWallet } =  require('@thirdweb-dev/wallets/evm/wallets/aws-kms');
//const AWS = require('aws-sdk');

// const {
//     AWS_ACCESS_KEY_ID,
//     AWS_SECRET_ACCESS_KEY,
//     YOUR_KMS_KEY_ID
// } = process.env

// AWS.config.update({
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   secretAccessKey:  AWS_SECRET_ACCESS_KEY,
//   region: REGION_ID,
// });



// const Wallet = new AwsKmsWallet({
//   region:REGION_ID,
//   accessKeyId: AWS_SECRET_ACCESS_KEY,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY,
//   sessionToken: process.env.AWS_SESSION_TOKEN,
//   keyId: YOUR_KMS_KEY_ID,
// });


const { API_KEY, PRIVATE_KEY } = process.env;

const settings = {
    apiKey: API_KEY,
    network: Network.MATIC_MUMBAI//ETH_GOERLI
};

const alchemy = new Alchemy(settings);
let wallet = new Wallet(PRIVATE_KEY);
var provider = new ethers.providers.AlchemyProvider(null,API_KEY);//goerli
provider = new ethers.providers.JsonRpcProvider(RPC_URL)
/**
 * AWS KMS上の鍵を使ってイーサリアムクライアントインスタンスを生成するメソッド
 */
// const createKmsSigner = () => {
//     //create singer object
//     const signer = new KmsEthersSigner({
//         keyId: KEY_ID,
//         kmsClientConfig: {
//             region: REGION_ID,
//             credentials: {
//                 accessKeyId: AWS_ACCESS_KEY_ID,
//                 secretAccessKey: AWS_SECRET_ACCESS_KEY
//             }
//         },
//     });

//     return signer;
// }

// const kms = new AWS.KMS();

// // Replace 'YOUR_KMS_KEY_ID' with the ID or ARN of your KMS key
// const kmsKeyId = YOUR_KMS_KEY_ID;

// const params = {
//   KeyId: kmsKeyId,
// };

// let r = kms.getPublicKey(params, (err, data) => {
//   if (err) {
//     console.error('Error retrieving private key from AWS KMS:', err);
//   } else {
//     // Use the private key retrieved from KMS
//     const privateKey = data.PublicKey;
//     console.log('keyyy',privateKey)
//     // Use the private key for signing Ethereum transactions or other cryptographic operations
//     // ...
//     let wallet = new Wallet(privateKey);
//     console.log('wal', wallet);
//   }
// });

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
    var i = 0;
    if(functionName === 'mint'){
        i++
    }
    try {
        
    var contract = new ethers.utils.Interface(abi);
    // crate contract function data
    var func = contract.encodeFunctionData(functionName, args);
   console.log('funcccccccccccc',func)
    // create provider
    //var provider = new ethers.providers.AlchemyProvider("maticmum",API_KEY);
    //let newprov = new ethers.providers.JsonRpcProvider('https://rpc-evm-sidechain.xrpl.org')
    //let wal = new ethers.Wallet(PRIVATE_KEY);
    // conncet provider
    //wal.connect(newprov)

    //console.log('xrp',newprov, wal.provider, await wal.getAddress())
    wallet.connect(provider);
    const addre = await wallet.getAddress();
    console.log('walletaddressssssssss',addre)
   
    // get nonce
    var nonce = await provider.getTransactionCount(addre, 'pending') + i;
    var gasLimit = functionName === 'createWallet' ? 2100000 : 210000
    //let nonce = await newprov.getTransactionCount(await wal.getAddress(), 'pending')+i
    // create tx data
    var tx = {
        gasPrice: 300000000000,
        gasLimit,
        data: func,
        to: address,
        nonce: nonce,
        chainId: 80001
    }
    // sign tx
    var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));
    
    
        const res = await provider.sendTransaction(signedTransaction);
        console.log("Tx send result:", res);
        //logger.log("Tx send result:", res);
    } catch(e) {
        console.log(e)
        //logger.error("Tx send error:", e);
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
        // create wallet object
        //var wallet = createKmsSigner();// using alchemy sdk
        // create provider
        //var provider = new ethers.providers.AlchemyProvider("maticmum",API_KEY);
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
            chainId: 80001
        }
        // sign tx
        var signedTransaction = await wallet.signTransaction(tx).then(ethers.utils.serializeTransaction(tx));
        //logger.log("signedTransaction:", signedTransaction);
        // push
        signedTxs.push(signedTransaction);
    }

    // execute
    
        // send tx
        var res;
        
        for(var i = 0; i< count; i++) {
            res = await provider.sendTransaction(signedTxs[i]);
            //logger.log("Tx send result:", res);
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
    // create wallet object
    //var wallet = createKmsSigner();
    // create provider
    try {
    //var provider = new ethers.providers.AlchemyProvider("maticmum",API_KEY);;
    // conncet provider
    wallet.connect(provider);
    // get nonce
    var nonce = await provider.getTransactionCount(await wallet.getAddress(),'pending');

    console.log('ETHER',new ethers.utils.parseEther(value.toString()))
   
    // create tx data
    var tx = {
        gasPrice:250000000000,
        gasLimit:210000,
        to: to,
        nonce: nonce,
        chainId: 80001,
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