"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const Logger_1 = require("./utils/Logger");
const Block_1 = require("./Block");
class Chain extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger_1.default({ context: 'Chain' });
        this.blocks = [Block_1.default.createGenesisBlock()];
    }
    open() {
        this.on('block', (block) => {
            this.handleBlock(block);
        });
    }
    getLatestBlock() {
        return this.blocks[this.blocks.length - 1];
    }
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
    balance(account) {
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
    add(block) {
        if (block.height === this.blocks.length &&
            block.previousHash === this.getLatestBlock().previousHash) {
            if (block.timestamp < this.getLatestBlock().timestamp) {
                this.blocks[this.blocks.length - 1] = block;
            }
            else if (block.timestamp === this.getLatestBlock().timestamp) {
                console.log('FORKKKK');
            }
        }
        else {
            this.blocks.push(block);
        }
    }
    getBlock(hash) {
        return this.blocks.find((block) => block.hash === hash);
    }
    has(hash) {
        return !!this.getBlock(hash);
    }
    handleBlock(block) {
        this.blocks.push(block);
    }
}
exports.default = Chain;
//# sourceMappingURL=Chain.js.map