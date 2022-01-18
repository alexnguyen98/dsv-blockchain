"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const Logger_1 = require("./utils/Logger");
const UserKey_1 = require("./UserKey");
const Transaction_1 = require("./Transaction");
class Wallet extends EventEmitter {
    constructor(options, chain) {
        super();
        this.logger = new Logger_1.default({ context: 'Wallet' });
        this.userKey = new UserKey_1.default(options.addr, options.id);
        this.chain = chain;
    }
    send(to, amount) {
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
        const tx = new Transaction_1.default(this.userKey.publicKey, to, amount, Date.now());
        tx.signTransaction(this.userKey);
        this.emit('tx', tx);
    }
    balance() {
        return this.chain.balance(this.userKey.publicKey);
    }
}
exports.default = Wallet;
//# sourceMappingURL=Wallet.js.map