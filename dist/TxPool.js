"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const Logger_1 = require("./utils/Logger");
class TxPool extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger_1.default({ context: 'TxPool' });
        this.pending = new Map();
    }
    add(tx) {
        this.pending.set(tx.hash, tx);
        this.emit('tx');
    }
    has(hash) {
        return this.pending.has(hash);
    }
    get(hash) {
        return this.pending.get(hash);
    }
    toArray() {
        const arr = [];
        this.pending.forEach((tx) => {
            arr.push(tx);
        });
        return arr;
    }
    flushPending(block) {
        for (const tx of block.txs) {
            this.pending.delete(tx.hash);
        }
    }
}
exports.default = TxPool;
//# sourceMappingURL=TxPool.js.map