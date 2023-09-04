/**
 * DID関連のメソッドを実装したモジュールファイル
 */

// did用のモジュールを読み込む
const { anchor, DID, generateKeyPair } = require('@decentralized-identity/ion-tools');

// node.js 18 and earlier, needs globalThis.crypto polyfill
const webcrypto = require('node:crypto');
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

/**
 * generateDID function
 */
const generateDID = async() => {
      try{
      // create key pair
      let authnKeys = await generateKeyPair();
      // new DID
      console.log('authkeyyyyyyyyy',authnKeys)
      let did = new DID({
            content: {
                  publicKeys: [
                        {
                              id: 'key-1',
                              type: 'EcdsaSecp256k1VerificationKey2019',
                              publicKeyJwk: authnKeys.publicJwk,
                              purposes: [ 'authentication' ]
                        }
                  ],
                  services: [
                        {
                              id: 'idq',
                              type: 'LinkedDomains',
                              serviceEndpoint: 'http://localhost:3000'
                        }
                  ]
            }
      });

      // anchor DID
      
      const requestBody = await did.generateRequest(0);
      console.log('DIDDDDDD',did, requestBody)
      let response;
      try{
             response =  await anchor(requestBody)
      } catch(err){}
      //console.log('req',request)
      //let response = {}//await request.submit();

         return{
            response,
            did
         }
   
      } catch(err) {console.log(err)}
};

module.exports = {
      generateDID
}