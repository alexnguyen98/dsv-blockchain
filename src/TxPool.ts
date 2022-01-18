import EventEmitter = require('events');
import Logger from './utils/Logger';
import Transaction from './Transaction';
import Block from './Block';

/**
 * A transaction pool for transaction management.
 */
class TxPool extends EventEmitter {
  logger: Logger;
  pending: Map<String, Transaction>;

  constructor() {
    super();
    this.logger = new Logger({ context: 'TxPool' });
    this.pending = new Map();
  }

  /**
   * Add transaction to pending and emit and event to tell others
   */
  add(tx: Transaction) {
    this.pending.set(tx.hash, tx);
    this.emit('tx');
  }

  /**
   * Check if transaction is in pending
   */
  has(hash: string) {
    return this.pending.has(hash);
  }

  /**
   * Get transaction based on hash
   */
  get(hash: string) {
    return this.pending.get(hash);
  }

  /**
   * Returns array of pending transactions
   */
  toArray() {
    const arr = [];
    this.pending.forEach((tx) => {
      arr.push(tx);
    });
    return arr;
  }

  /**
   * Flush pending transactions of a mined block
   */
  flushPending(block: Block) {
    for (const tx of block.txs) {
      this.pending.delete(tx.hash);
    }
  }
}

export default TxPool;
