require('dotenv/config');
const { API_KEY } = process.env;

// chain ID
const CHAIN_ID = '11155111';
//ae93e2399730c5f6708fe01b075b2a76e8947245dcc602b315359e052252f0c2 c5e30a676c5bfef2c6ab4e71ef40cb0b82154caa9ee2adb686ab1dddd88b258a 7f438d21c3ac2b37521d200d2bde9b329a1fdd29e1d3d95727227d878f9c38fd
// RPC URL
const RPC_URL = `https://polygon-mumbai.g.alchemy.com/v2/${API_KEY}`;//`https://eth-sepolia.g.alchemy.com/v2/3fMr3CwsUtbgtcenWRgX9A0Cx9tkOfVr`;// //`https://eth-goerli.g.alchemy.com/v2/${API_KEY}`;
const ISSUER_DID = 'https://blockcerts-20230113.storage.googleapis.com/profile.json';
const CONTROLLER = 'did:web:blockcerts-20230113.storage.googleapis.com';

// AWS info
const REGION_ID = "ap-northeast-3";
const KEY_ID = "a440908b-8b7f-4202-b33a-8446a3544e0e";

/**
 * VCのテンプレ
 */
const TEMPLATE_VC = {
      '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/blockcerts/v3',
      ],
      type: ['VerifiableCredential', 'BlockcertsCredential'],
      credentialSubject: {
            id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
      },
};

/**
 * Profileドキュメントのテンプレ
 * その他必要な要素： id, name, url, email, publickey
 */
const TEMPLATE_PROFILE = {
      '@context': [
            'https://w3id.org/openbadges/v2',
            'https://w3id.org/blockcerts/v3'
      ],
      type: 'Profile',
}

/**
 * DIDドキュメントのテンプレ
 * その他必要な要素、id, service, verificationMethod
 */
const TEMPLATE_DID = {
      '@context': ['https://www.w3.org/ns/did/v1'],
}

// DIDドキュメントを格納するフォルダパス
const FOLDER_PATH = 'data';

module.exports = {
      RPC_URL,
      CHAIN_ID,
      ISSUER_DID,
      CONTROLLER,
      TEMPLATE_VC,
      TEMPLATE_PROFILE,
      TEMPLATE_DID,
      FOLDER_PATH,
      REGION_ID,
      KEY_ID,
};