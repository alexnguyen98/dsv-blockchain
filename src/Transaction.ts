import UserKey from './UserKey';
import { hashString } from './utils/hash';

const COINBASE_REWARD = 50;

/**
 * A Transaction between two addresses with a certain amount
 */
class Transaction {
  hash: string;
  from: string;
  to: string;
  signature: string;
  amount: number;
  timestamp: number;

  constructor(
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    signature?: string,
  ) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.signature = signature;

    this.hash = this.calculateHash();
  }

  /**
   * Create Coinbase transaction
   */
  static createCoinbaseTx(to: string) {
    const tx = new this('', to, COINBASE_REWARD, Date.now(), '');

    return tx;
  }

  /**
   * Calculate hash numbers from transaction data
   */
  calculateHash() {
    return hashString('' + this.from + this.to + this.amount + this.timestamp);
  }

  /**
   * Sign transaction
   */
  signTransaction(userKey: UserKey) {
    if (!this.to && userKey.publicKey !== this.from) {
      throw new Error('Cannot sign others transaction');
    }

    this.signature = UserKey.sign(this.hash, userKey.privateKey);
  }

  /**
   * Check transaction validity
   */
  isValid() {
    // Allow coinbase transactions to be valid
    if (this.isCoinbase()) return true;

    if (!this.signature) {
      return false;
    }

    return UserKey.verify(this.hash, this.signature, this.from);
  }

  /**
   * Check if transaction is a coinbase
   */
  isCoinbase() {
    return !this.from;
  }

  /**
   * Return string summary of transaction
   */
  toString() {
    return `tx: sending ${this.amount} BTC from ${this.from} to ${this.to}`;
  }
}

export default Transaction;
