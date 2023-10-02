/**
 * DID関連のメソッドを実装したモジュールファイル
 */

// did用のモジュールを読み込む


const { anchor, DID, generateKeyPair, sign, verify, resolve} = require('@decentralized-identity/ion-tools');
const { webcrypto } = require('crypto');

if (!globalThis.crypto) globalThis.crypto = webcrypto;
// @ts-ignore

const generateDID = async() => {

      // Generate keys and ION DID
let { publicJwk, privateJwk}= await generateKeyPair();
let did = new DID({
  content: {
    publicKeys: [
      {
        id: "key-1",
        type: "EcdsaSecp256k1VerificationKey2019",
        publicKeyJwk: publicJwk,
        purposes: ["authentication"],
      },
    ],
    services: [
      {
        id: "domain-1",
        type: "LinkedDomains",
        serviceEndpoint: "https://foo.example.com",
      },
    ],
  }
});

// Generate and publish create request to an ION node
let anchorResponse;

let createRequest;
try{
    
      let uri = await did.getURI()
      console.log('URIII',uri)
      createRequest = await did.generateRequest();
      console.log('REQUEST',createRequest)

      const didDoc = await resolve(uri);
      console.log('DIDDOC', didDoc)
      anchorResponse = await anchor(createRequest);
      console.log('REQUEST',anchorResponse)


} catch(err){console.log('err during register',err)}
 
      
            return{
                  createRequest,
                  did
            }

};

module.exports = {
      generateDID
}




// // Store the key material and source data of all operations that have been created for the DID
// let ionOps = await did.getAllOperations();
// await writeFile('./ion-did-ops-v1.json', JSON.stringify({ ops: ionOps }));

// /**
//  * generateDID function
//  */
// const generateDID = async() => {
//       try{
//       // create key pair
//       let authnKeys = await generateKeyPair('secp256k1');
//       // new DID
//       console.log('authkeyyyyyyyyy',authnKeys)
//       let did = new DID({
//             content: {
//                   publicKeys: [
//                         {
//                               id: 'key-1',
//                               type: 'EcdsaSecp256k1VerificationKey2019',
//                               publicKeyJwk: authnKeys.publicJwk,
//                               purposes: [ 'authentication' ]
//                         }
//                   ],
//                   services: [
//                         {
//                               id: 'idq',
//                               type: 'LinkedDomains',
//                               serviceEndpoint: 'http://localhost:3000'
//                         }
//                   ]
//             }
//       });

//       // anchor DID
      
//       const requestBody = await did.generateRequest(0);
//       console.log('DIDDDDDD',did, requestBody)
//       let response;
//       try{
//              response =  await anchor(requestBody)
//       } catch(err){}
//       //console.log('req',request)
//       //let response = {}//await request.submit();

//          return{
//             response,
//             did
//          }
   
//       } catch(err) {console.log(err)}
// };

// module.exports = {
//       generateDID
// }