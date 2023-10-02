require('dotenv/config');
const { API_KEY } = process.env;

// chain ID
const CHAIN_ID = 1440002;

// RPC URL
const RPC_URL = 'https://rpc-evm-sidechain.xrpl.org';//`https://polygon-mumbai.g.alchemy.com/v2/${API_KEY}`;
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