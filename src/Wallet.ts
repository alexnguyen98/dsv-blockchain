import EventEmitter = require('events');
import { Options } from './types/Options';
import Logger from './utils/Logger';
import Chain from './Chain';
import UserKey from './UserKey';
import Transaction from './Transaction';

/**
 * Wallet for key management and transaction logic
 */
class Wallet extends EventEmitter {
  logger: Logger;
  userKey: UserKey;
  chain: Chain;

  constructor(options: Options, chain: Chain) {
    super();
    this.logger = new Logger({ context: 'Wallet' });
    this.userKey = new UserKey(options.addr, options.id);
    this.chain = chain;
  }

  /**
   * Send amount to address
   */
  send(to: string, amount: number) {
    if (!to) {
      this.logger.error('To address not specified');
      return;
    }
    if (!(amount >= 0)) {
      this.logger.error('Amount too low');
      return;
    }
    if (amount > this.balance()) {
      this.logger.error('Balance too low');
      return;
    }

    const tx = new Transaction(this.userKey.publicKey, to, amount, Date.now());
    tx.signTransaction(this.userKey);

    this.emit('tx', tx);
  }

  /**
   * Get my current balance
   */
  balance() {
    return this.chain.balance(this.userKey.publicKey);
  }
}

export default Wallet;
