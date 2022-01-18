import EventEmitter = require('events');
import Logger from './utils/Logger';
import Block from './Block';
import Peer from './Peer';
import { PACKET_TYPES } from './types/Packet';

/**
 * Blockchain representation
 */
class Chain extends EventEmitter {
  logger: Logger;
  blocks: Block[];

  constructor() {
    super();
    this.logger = new Logger({ context: 'Chain' });
    this.blocks = [Block.createGenesisBlock()];
  }

  /**
   * Bind events
   */
  open() {
    this.on('block', (block) => {
      this.handleBlock(block);
    });
  }

  /**
   * Get head block in chain
   */
  getLatestBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  /**
   * Check if chain is still valid
   */
  isChainValid() {
    for (let i = 1; i < this.blocks.length; i++) {
      const cur = this.blocks[i];
      const prev = this.blocks[i - 1];

      if (cur.hash === prev.hash) {
        return false;
      }

      if (cur.previousHash !== prev.hash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get balance by account addr
   */
  balance(account: string) {
    let balance = 0;

    this.blocks.forEach((b) => {
      b.txs.forEach((tx) => {
        if (tx.to === account) {
          balance += tx.amount;
        }
        if (tx.from === account) {
          balance -= tx.amount;
        }
      });
    });

    return balance;
  }

  /**
   * Add a block to chain
   */
  add(block: Block, peer?: Peer) {
    // Two competing blocks, fork situation
    if (block.previousHash === this.getLatestBlock().previousHash) {
      console.log('fork situation');
      return;
    }

    this.blocks.push(block);
    this.emit('stop');
  }

  /**
   * Get block by hash
   */
  getBlock(hash: string) {
    return this.blocks.find((block) => block.hash === hash);
  }

  /**
   * Check if chain has a block
   */
  has(hash: string) {
    return !!this.getBlock(hash);
  }

  /**
   * Handle block from event
   */
  handleBlock(block: Block) {
    this.blocks.push(block);
  }

  /**
   * Handle resync
   */
  resync() {
    this.blocks = [Block.createGenesisBlock()];
  }
}

export default Chain;
