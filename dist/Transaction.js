"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserKey_1 = require("./UserKey");
const hash_1 = require("./utils/hash");
const COINBASE_REWARD = 50;
class Transaction {
    constructor(from, to, amount, timestamp, signature) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.timestamp = timestamp;
        this.signature = signature;
        this.hash = this.calculateHash();
    }
    static createCoinbaseTx(to) {
        const tx = new this('', to, COINBASE_REWARD, Date.now(), '');
        return tx;
    }
    calculateHash() {
        return (0, hash_1.hashString)('' + this.from + this.to + this.amount + this.timestamp);
    }
    signTransaction(userKey) {
        if (!this.to && userKey.publicKey !== this.from) {
            throw new Error('Cannot sign others transaction');
        }
        this.signature = UserKey_1.default.sign(this.hash, userKey.privateKey);
    }
    isValid() {
        if (this.isCoinbase())
            return true;
        if (!this.signature) {
            return false;
        }
        return UserKey_1.default.verify(this.hash, this.signature, this.from);
    }
    isCoinbase() {
        return !this.from;
    }
    toString() {
        return `tx: sending ${this.amount} BTC from ${this.from} to ${this.to}`;
    }
}
exports.default = Transaction;
//# sourceMappingURL=Transaction.js.map