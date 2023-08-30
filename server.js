/**
 * APIサーバー設定ファイル
 */

// import app modules
const {
  app
} = require('./index');

const ip = require('ip');

// ポート番号
const portNo = 3001;

// APIサーバー起動
const server = app.listen(portNo, () => {
  //logger.debug('起動しました', `https://${ip.address()}:${portNo}`);//http://localhost:3001
  console.log('起動しました', `https://${ip.address()}:${portNo}`);
});

module.exports = {
  server
}
