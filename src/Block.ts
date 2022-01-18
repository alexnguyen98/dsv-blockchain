import Transaction from './Transaction';
import * as crypto from 'crypto';

/**
 * A Block with transactions and hashes
 */
class Block {
  hash: string;
  previousHash: string;
  timestamp: number;
  height: number;
  nonce: number;
  txs: Transaction[];

  constructor(
    previousHash: string,
    timestamp: number,
    height: number,
    txs: Transaction[],
    hash?: string,
    nonce?: number,
  ) {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.height = height;
    this.txs = txs;
    this.hash = hash;
    this.nonce = nonce;
  }

  /**
   * Returns the genesis block
   */
  static createGenesisBlock() {
    const origin = new Date('1998.07.04').getTime() / 1000;
    const block = new Block('Genesis', origin, 1, []);
    block.nonce = 0;
    block.hash = '';
    return block;
  }

  /**
   * Check block validity
   */
  isValid() {
    if (this.hash === this.previousHash) {
      return false;
    }

    for (const tx of this.txs) {
      if (!tx.isValid()) return false;
    }

    const curHash = crypto
      .createHash('sha256')
      .update(this.getPayload() + (this.nonce - 1))
      .digest('hex');

    if (this.hash !== curHash) {
      return false;
    }

    return true;
  }

  /**
   * Add transaction to list
   */
  addTX(tx: Transaction) {
    this.txs.push(tx);
  }

  /**
   * Get payload summary
   */
  getPayload() {
    let payload = '';

    payload += this.timestamp;
    for (const tx of this.txs) {
      payload += tx.hash;
    }

    return payload;
  }
}

export default Block;
