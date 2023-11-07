require('dotenv').config();
const express = require('express');
const app = express();
const { ethers } = require('ethers');
const { ION} = require('@decentralized-identity/ion-tools');
const cors = require('cors');
//const cardimg = require('./images/cardimg.jpg')
const ThirdwebSDK = require('@thirdweb-dev/sdk')
// Load blockchain functionality module
const {
  sendTx,
  sendBatchTx,
  sendEth,
  wallet,
  provider
}= require('./contracts/UseContract');

// ABIs
const { FactoryABI } = require('./contracts/ABI/FactoryABI');
const { MyTokenABI } = require('./contracts/ABI/MyTokenABI');
const { WalletABI } = require('./contracts/ABI/WalletABI');
// contract address
const contractAddr = require('./contracts/Address');
// get contants 
const {
  RPC_URL,
  CHAIN_ID,
  LOYALTY_CONTRACT_ADRESS
} = require('./utils/constants');
const { generateDID } = require('./modules/did/did');
const { uploadFileToIpfs } = require('./modules/ipfs/ipfs');

// get Mnemonic code
const {
  STRIPE_API_KEY
} = process.env

// Variable definition for stripe
const stripe = require("stripe")(`${STRIPE_API_KEY}`);
app.use(express.static("public"));
app.use(express.json());
// Enable CORS for all routes
app.use(cors());

////////////////////////////////////////////////////////////
// APIの定義
////////////////////////////////////////////////////////////

/**
 * API to issue tokens
 * @param to Issue address
 * @param amount Issue amount
 */


app.post('/api/mintToken', async(req, res) => {
  
  console.log("発行用のAPI開始");

  const to = req.query.to;
  const amount = req.query.amount;

  // call send Tx function
  let result = await sendTx(
    MyTokenABI, 
    contractAddr.MYTOKEN_ADDRESS, 
    "mint", 
    [to, amount], 
    RPC_URL, 
    CHAIN_ID
  );

  console.log('MINTRESULT', result)

  let result1 = await sendTx(
    MyTokenABI, 
    contractAddr.MYTOKEN_ADDRESS, 
    "burnToken", 
    [to, 0],
    RPC_URL, 
    CHAIN_ID
  );
  console.log('resultburnformint', result1)
    
  if(result == true) {
      console.log("発行用のAPI終了");
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'success' });
  } else {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
  }
});
    
/**
 * API to amortize Token
 * @param to amortized address
 * @param amount Depreciation amount
 * @param walletAddr wallet address
 */
app.post('/api/burnToken', async(req, res) => {
 
  const to = req.query.to;
  const amount = req.query.amount;
  const walletAddr = req.query.walletAddr;

  // call send Tx function
  var result = await sendTx(
    MyTokenABI, 
    contractAddr.MYTOKEN_ADDRESS, 
    "burnToken", 
    [to, amount],
    RPC_URL, 
    CHAIN_ID
  );
    console.log('burnresult',result)
  if(result == true) {
    // send ETH 
    var result = await sendEth(
      walletAddr, 
      amount, 
      RPC_URL, 
      CHAIN_ID
    );
    console.log('sendethresult',result)
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});
    
/**
 * API to get Token balance
 * @param addr Address to get balance
 */
app.post('/api/balance/token', async(req, res) => {
 
  const addr = req.query.addr;

  const contract = new ethers.Contract(contractAddr.MYTOKEN_ADDRESS, MyTokenABI, provider);
  const balance = await contract.balanceOf(addr);

  res.set({ 'Access-Control-Allow-Origin': '*' });
  res.json({ balance: balance });
});
    
/**
 * API to send Token
 * @param from DID of sender
 * @param to DID of remittance destination
 * @param amount Total amount
 */
app.post('/api/send', async(req, res) => {
 
  // get params
  const from = req.query.from;
  const to = req.query.to;
  const amount = req.query.amount;  

  /**
   * check function
   */
  const resultCheck = (result) => {
    if(result == true) {

      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'success' });
    } else {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
    }
  }
      
  try {
    
    // create mytoken contract 
    const myTokenContract = new ethers.Contract(contractAddr.MYTOKEN_ADDRESS, MyTokenABI, provider);
    // create factory contract
    const factoryContract = new ethers.Contract(contractAddr.FACTORY_ADDRESS, FactoryABI, provider);
    
    // get address from did
    const fromAddr = await factoryContract.addrs(from);
    const receiveAddr = await factoryContract.addrs(to);
    // get addr from did
    const balance = await myTokenContract.balanceOf(fromAddr);
  
    // check balance
    if(Number(balance._hex) >= amount) {
      // 結果を格納するための変数
      var result;

      // Arrary for Tx 
      const txs = [];
      // create tx info
      var tx = [
        MyTokenABI, 
        contractAddr.MYTOKEN_ADDRESS, 
        "burnToken", 
        [fromAddr, amount],
        RPC_URL, 
        CHAIN_ID
      ];
      // push
      txs.push(tx);
      // create tx info
      tx = [
        MyTokenABI, 
        contractAddr.MYTOKEN_ADDRESS, 
        "mint", 
        [receiveAddr, amount], 
        RPC_URL, 
        CHAIN_ID
      ];
      // push
      txs.push(tx);

      // call sendBatchTxs function
      result = await sendBatchTx(txs).then((result) => resultCheck(result));
    } else {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
    }
  } catch(err) {
    console.log(err)
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});
    
/**
 * API to create DID
 * @param addr Address to register
 */
app.post('/api/create', async(req, res) => {
  const addr = req.query.addr;

  // generate DID document
  let {
    response,
    did
  } = await generateDID();
  
  // get DID URL
  const didUrl = await did.getURI('short');
  
  try {
    // set to Factory contract
    var result = await sendTx(
      FactoryABI, 
      contractAddr.FACTORY_ADDRESS, 
      "register", 
      [addr, didUrl], 
      RPC_URL, 
      CHAIN_ID
    );

    console.log('RESULT',result)
    if(result == true) {

      res.send({result:"success"})
   
    } else {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
    }
  } catch(err) {
 
      console.log(err)
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
  }
});


///////////////////////////////
app.post('/api/createuser', async(req, res) => {
  const wallet = ethers.Wallet.createRandom()
  wallet.connect(provider);

  const addr = await wallet.getAddress();
  const key = await wallet.privateKey;
  const data = req.query.data;
  console.log('PRIVATEKEY',key)
  if(!key){
     return
  }
  
  try {
    // set to Factory contract
    var result = await sendTx(
      FactoryABI, 
      contractAddr.FACTORY_ADDRESS, 
      "creatUser", 
      [data, addr, key], 
      RPC_URL, 
      CHAIN_ID
    );

    console.log('RESULT',result)

    if(result == true) {
      res.send({addr: addr})
    } else {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
    }
  } catch(err) {
      res.set({ 'Access-Control-Allow-Origin': '*' });
      res.json({ result: 'fail' });
  }
  
});

app.post('/api/login', async(req, res) => {
  const pass = req.query.password;

  const factoryContract = new ethers.Contract(contractAddr.FACTORY_ADDRESS, FactoryABI, provider);
    
  // get address from did
  const frompassaddr = await factoryContract.pass(pass);
  if(frompassaddr) {
      res.send({addr: frompassaddr})
  } else {
    res.send('user not found')
  }
  
});
    
    
/**
 * API to search DID documents
 */
app.get('/api/resolve', async(req, res) => {
  const uri = req.query.uri;
  // resolve
  const response = await ION.resolve(uri);
  //logger.log("response:", response);

  res.set({ 'Access-Control-Allow-Origin': '*' });
  res.json({ result : response });
});
    
/**
 *  API for signature processing using DID
 */
app.post('/api/sign', async(req, res) => {
  // TO-DO
});
    
/**
 * API to verify signature using DID
 */
app.post('/api/verify', async(req, res) => {
  // TO-DO
});
    
/**
 * API for executing FactoryWallet methods (there is an issue where arrays cannot be passed)
 * @param methodName method name
 * @param args arguments
 */
app.post('/api/excute/factory', async(req, res) => {
  const methodName = req.query.methodName;
  const args = req.query.args;

  // call send Tx function
  var result = await sendTx(
    FactoryABI, 
    contractAddr.FACTORY_ADDRESS, 
    methodName, 
    args, 
    RPC_URL, 
    CHAIN_ID
  );
    
  if(result == true) {
   
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});

/**
 * API for creating a multisig wallet
 * @param name wallet name
 * @param owners array of addresses
 * @param required threshold
 */
app.post('/api/factory/create', async(req, res) => {
  const name = req.query.name;
  const owners = req.query.owners;
  const required = req.query.required;
  // To divide
  var ownerAddrs = owners;
  console.log('owneradd',ownerAddrs, required)
  // call send Tx function
  var result = await sendTx(
    FactoryABI, 
    contractAddr.FACTORY_ADDRESS, 
    "createWallet", 
    [name, ownerAddrs, required], 
    RPC_URL, 
    CHAIN_ID
  );
   console.log('RESULT',result) 
  if(result == true) {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});


app.post('/api/factory/delete', async(req, res) => {
  const index= req.query.id;
 
 console.log('INDEX',index)
  // call send Tx function
  var result = await sendTx(
    FactoryABI, 
    contractAddr.FACTORY_ADDRESS, 
    "deleteWallets", 
    [index], 
    RPC_URL, 
    CHAIN_ID
  );
   console.log('RESULT',result) 
  if(result == true) {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});

/**
 * API for submitting transactions
 * @param to Remittance address
 * @param value Amount of remittance
 * @param data byte data
 * @param address ウォレットアドレス
 */
app.post('/api/wallet/submit', async(req, res) => {

  const to = req.query.to;
  const value = new ethers.utils.parseUnits(req.query.value, 'ether')
  const data = req.query.data;
  const address = req.query.address;
  const sender = req.query.sender;
  const walletContract = new ethers.Contract(address, WalletABI, provider);
  
  // get address from did
  let isowner = await walletContract.verifyOwner(sender);

  console.log('QUERY',req.query,isowner)
  
  // call send Tx function
  if(isowner){
  var result = await sendTx(
    WalletABI, 
    address, 
    "submit", 
    [to, value, data], 
    RPC_URL, 
    CHAIN_ID,
  );
    
  if(result == true) {

    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
 
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
}
});

/**
 * API for approving transactions
 * @param txId transaction ID
 * @param address wallet address
 */
app.post('/api/wallet/approve', async(req, res) => {
  
  // Get function arguments.
  const txId = req.query.txId;
  const address = req.query.address;
  const sender = req.query.sender;

  var walletContract = new ethers.Contract(address, WalletABI, provider);
    
  // get address from did
  let isowner = await walletContract.verifyOwner(sender);

  // call send Tx function
  if(isowner){
  var result = await sendTx(
    WalletABI, 
    address, 
    "approve", 
    [txId, sender], 
    RPC_URL, 
    CHAIN_ID
  );
    console.log(result)
  if(result == true) {

    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
}
});

/**
 * API for revoke transactions
 * @param txId transaction ID
 * @param address wallet address
 */
app.post('/api/wallet/revoke', async(req, res) => {
  
  // Get function arguments.
  const txId = req.query.txId;
  const address = req.query.address;
  const sender = req.query.sender;
  const walletContract = new ethers.Contract(address, WalletABI, provider);
    
  // get address from did
  const isowner = await walletContract.verifyOwner(sender);
  // call send Tx function
  if(isowner){
  var result = await sendTx(
    WalletABI, 
    address, 
    "revoke", 
    [txId, sender], 
    RPC_URL, 
    CHAIN_ID
  );
  console.log(result)
  if(result == true) {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
  
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
}
});

/**
 * API for executing transactions
 * @param txId transaction ID
 * @param address wallet address
 */
app.post('/api/wallet/execute', async(req, res) => {
  
  // Get function arguments.
  var txId = req.query.txId;
  var address = req.query.address;

  // call send Tx function
  var result = await sendTx(
    WalletABI, 
    address, 
    "execute", 
    [txId], 
    RPC_URL, 
    CHAIN_ID
  );
  console.log(result)
  if(result == true) {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {
    
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});

/**
 * API for using stripe's Payment element
 */
app.get("/api/create-payment-intent", async (req, res) => {
  // create paymentIntent 
  try{
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1400,
    currency: "jpy",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.set({ 'Access-Control-Allow-Origin': '*' });
  // send
  res.send(
    {clientSecret: paymentIntent.client_secret}
  );
  
} catch(err) {
  console.log(err)
  res.send(err)}
});

/**
 * API to register VC CID information in smart contract
 * @param did DID
 * @param name VC file name
 * @param cid CID information
 */

app.post("/api/claimnft", async (req, res) => {

  try{
    const addr = req.query.addr
    const key =  req.query.key

    console.log('KEY',key, addr)
    if(!process.env.PRIVATE_KEY){
      throw new errors("PRIVATE KEY IS NOT SET")
    }
   
    const sdk =ThirdwebSDK.ThirdwebSDK.fromPrivateKey(
      key,
      "mumbai",
      {
        secretKey: process.env.TW_SECRATE_KEY
      }
    );

    const loyaltyCardContract = await sdk.getContract(LOYALTY_CONTRACT_ADRESS)

     const payload = {
      to:addr,
      metadata:{
        name:" Soul Loyalty card",
        description:` Soul Loyaly card for ${addr}`,
        
        atributes:[
          {
            traid_type: "Points",
            value:10,
          }
        ]
      }
     }

     const signedpayload = await loyaltyCardContract.erc721.signature.generate(payload)
  res.set({ 'Access-Control-Allow-Origin': '*' });
  
  res.send(
    {response: JSON.stringify(signedpayload)}
  );
  
} catch(err) {
  console.log(err)
  res.send(err)}
});


app.post("/api/registerIpfs", async (req, res) => {

  // Get information from request parameters.
  var did = req.query.did;
  var name = req.query.name;
  var cid = req.query.cid;
  
  // Register with IPFS
  var result = await sendTx(
    FactoryABI,
    contractAddr.FACTORY_ADDRESS, 
    "updateVc", 
    [did, name, cid], 
    RPC_URL, 
    CHAIN_ID
  );

  if(result == true) {
 
    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'success' });
  } else {

    res.set({ 'Access-Control-Allow-Origin': '*' });
    res.json({ result: 'fail' });
  }
});

let portNo = 3001

//API server start
const server = app.listen(portNo, () => {
  console.log('起動しました');
});

process.on('SIGINT', () => {
  console.log('Closing the server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit();
  });
});


