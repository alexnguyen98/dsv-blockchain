"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
class Block {
    constructor(previousHash, timestamp, height, txs, hash, nonce) {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.height = height;
        this.txs = txs;
        this.hash = hash;
        this.nonce = nonce;
    }
    static createGenesisBlock() {
        const origin = new Date('1998.07.04').getTime() / 1000;
        const block = new Block('Genesis', origin, 1, []);
        block.nonce = 0;
        block.hash = '';
        return block;
    }
    isValid() {
        if (this.hash === this.previousHash) {
            return false;
        }
        for (const tx of this.txs) {
            if (!tx.isValid())
                return false;
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
    addTX(tx) {
        this.txs.push(tx);
    }
    getPayload() {
        return this.previousHash + this.timestamp + JSON.stringify(this.txs);
    }
}
exports.default = Block;
//# sourceMappingURL=Block.js.map