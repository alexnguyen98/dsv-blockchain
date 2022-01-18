const { parentPort } = require('worker_threads');
const crypto = require('crypto');

const DIFICULITY = 2;

parentPort.once('message', (message) => {
  const payload = message;
  let nonce = 0;
  let hash = '';

  do {
    hash = crypto
      .createHash('sha256')
      .update(payload + nonce)
      .digest('hex');
    nonce++;
  } while (hash.slice(0, DIFICULITY) !== '0'.repeat(DIFICULITY));

  parentPort.postMessage({ nonce, hash });
});
