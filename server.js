/**
 * APIサーバー設定ファイル
 */

// import app modules
const {
  app,
  logger
} = require('./modules/app');
const ip = require('ip');

// ポート番号
const portNo = 3001;

// APIサーバー起動
const server = app.listen(portNo, () => {
  logger.debug('起動しました', `http://localhost:3001`);//https://${ip.address()}:${portNo}
  console.log('起動しました', `http://localhost:3001`);
});

module.exports = {
  server
}
