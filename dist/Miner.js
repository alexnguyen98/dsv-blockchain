"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const worker_threads_1 = require("worker_threads");
const Logger_1 = require("./utils/Logger");
const Block_1 = require("./Block");
const Transaction_1 = require("./Transaction");
class Miner extends EventEmitter {
    constructor(txpool, chain, userKey) {
        super();
        this.logger = new Logger_1.default({ context: 'Miner' });
        this.txpool = txpool;
        this.chain = chain;
        this.userKey = userKey;
        this.mining = false;
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            this.txpool.on('tx', () => {
                this.handleTx();
            });
        });
    }
    handleTx() {
        const block = this.createBlockTemplate();
        for (const tx of this.txpool.toArray()) {
            block.addTX(tx);
        }
        this.mineBlock(block);
    }
    addCoinbaseTx(block) {
        const tx = Transaction_1.default.createCoinbaseTx(this.userKey.publicKey);
        tx.signTransaction(this.userKey);
        block.addTX(tx);
    }
    createBlockTemplate() {
        const lastHash = this.chain.getLatestBlock().hash;
        const height = this.chain.getLatestBlock().height + 1;
        const timestamp = Date.now();
        const txs = [];
        const block = new Block_1.default(lastHash, timestamp, height, txs);
        this.addCoinbaseTx(block);
        return block;
    }
    mineCoinbaseBlock() {
        const block = this.createBlockTemplate();
        this.mineBlock(block);
    }
    mineBlock(block) {
        if (this.mining || this.worker) {
            this.logger.error('Miner is already mining');
            return;
        }
        this.mining = true;
        this.block = block;
        this.createWorker();
    }
    createWorker() {
        this.worker = new worker_threads_1.Worker('./src/worker.js');
        this.worker.once('message', (message) => {
            this.handleBlockMined(message);
        });
        this.worker.on('error', (err) => {
            this.logger.error(err.message);
        });
        this.worker.postMessage(this.block.getPayload());
    }
    handleBlockMined({ nonce, hash }) {
        this.logger.info('Block successfully mined');
        this.stopWorker();
        this.block.hash = hash;
        this.block.nonce = nonce;
        this.chain.add(this.block);
        this.emit('block', this.block);
    }
    stopMining() {
        if (this.mining || this.worker) {
            this.logger.debug('Stopping worker');
            this.stopWorker();
        }
    }
    stopWorker() {
        this.worker.terminate();
        this.worker = null;
        this.mining = false;
    }
}
exports.default = Miner;
//# sourceMappingURL=Miner.js.map