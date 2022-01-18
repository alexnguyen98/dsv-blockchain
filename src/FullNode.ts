import { Options } from './types/Options';
import Logger from './utils/Logger';
import Pool from './Pool';
import TxPool from './TxPool';
import Chain from './Chain';
import Wallet from './Wallet';
import Miner from './Miner';

/**
 * A fullnode with chain, txmpool, wallet, miner and pool.
 */
class FullNode {
  logger: Logger;
  pool: Pool;
  txpool: TxPool;
  chain: Chain;
  wallet: Wallet;
  miner: Miner;

  constructor(options: Options) {
    this.logger = new Logger({ context: 'FullNode' });
    this.chain = new Chain();
    this.txpool = new TxPool();
    this.pool = new Pool(options, this.txpool, this.chain);
    this.wallet = new Wallet(options, this.chain);
    this.miner = new Miner(this.txpool, this.chain, this.wallet.userKey);

    this.init();
  }

  /**
   * Bind events
   */
  init() {
    this.miner.on('block', (block) => {
      this.txpool.flushPending(block);
      this.pool.broadcastBlock(block);
    });

    this.wallet.on('tx', (tx) => {
      this.pool.broadcastTXs([tx]);
      this.txpool.add(tx);
    });
  }

  /**
   * Load fullnode
   */
  async open() {
    await this.pool.open();
    await this.miner.open();
    this.logger.info('FullNode loaded');
  }

  /**
   * Connect to the network
   */
  connect() {
    this.pool.connect();
  }
}

export default FullNode;
