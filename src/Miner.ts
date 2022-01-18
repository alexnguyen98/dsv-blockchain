import EventEmitter = require('events');
import { Worker } from 'worker_threads';
import Logger from './utils/Logger';
import Block from './Block';
import Chain from './Chain';
import Pool from './Pool';
import Transaction from './Transaction';
import TxPool from './TxPool';
import UserKey from './UserKey';

/**
 * a miner thats working on the proof of work
 */
class Miner extends EventEmitter {
  logger: Logger;
  txpool: TxPool;
  pool: Pool;
  chain: Chain;
  worker: Worker;
  block: Block;
  userKey: UserKey;
  mining: boolean;

  constructor(txpool: TxPool, chain: Chain, userKey: UserKey) {
    super();
    this.logger = new Logger({ context: 'Miner' });
    this.txpool = txpool;
    this.chain = chain;
    this.userKey = userKey;
    this.mining = false;
  }

  /**
   * Bind events
   */
  async open() {
    this.txpool.on('tx', () => {
      this.handleTx();
    });
  }

  /**
   * Handling new transaction to mine
   */
  handleTx() {
    const block = this.createBlockTemplate();
    for (const tx of this.txpool.toArray()) {
      block.addTX(tx);
    }

    this.mineBlock(block);
  }

  /**
   * Add a coinbase transaction to block
   */
  addCoinbaseTx(block: Block) {
    const tx = Transaction.createCoinbaseTx(this.userKey.publicKey);
    tx.signTransaction(this.userKey);
    block.addTX(tx);
  }

  /**
   * Create a block template for mining
   */
  createBlockTemplate() {
    const lastHash = this.chain.getLatestBlock().hash;
    const height = this.chain.getLatestBlock().height + 1;
    const timestamp = Date.now();
    const txs = [];

    const block = new Block(lastHash, timestamp, height, txs);
    this.addCoinbaseTx(block);

    return block;
  }

  /**
   * Mine coinbase block
   */
  mineCoinbaseBlock() {
    const block = this.createBlockTemplate();
    this.mineBlock(block);
  }

  /**
   * Start proof of work computation
   */
  mineBlock(block: Block) {
    if (this.mining || this.worker) {
      this.logger.error('Miner is already mining');
      return;
    }
    this.mining = true;
    this.block = block;
    this.createWorker();
  }

  /**
   * Create a new thread for computation
   */
  createWorker() {
    this.worker = new Worker('./src/worker.js');

    this.worker.once('message', (message) => {
      this.handleBlockMined(message);
    });

    this.worker.on('error', (err) => {
      this.logger.error(err.message);
    });

    this.worker.postMessage(this.block.getPayload());
  }

  /**
   * Handle successfull mined block
   */
  handleBlockMined({ nonce, hash }: { nonce: number; hash: string }) {
    this.logger.info('Block successfully mined');

    this.stopWorker();

    this.block.hash = hash;
    this.block.nonce = nonce;

    this.chain.add(this.block);
    this.emit('block', this.block);
  }

  /**
   * Stop mining
   */
  stopMining() {
    if (this.mining || this.worker) {
      this.logger.debug('Stopping worker');
      this.stopWorker();
    }
  }

  /**
   * Terminate worker and stop mining status
   */
  stopWorker() {
    this.worker.terminate();
    this.worker = null;
    this.mining = false;
  }
}

export default Miner;
