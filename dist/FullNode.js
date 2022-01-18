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
const Logger_1 = require("./utils/Logger");
const Pool_1 = require("./Pool");
const TxPool_1 = require("./TxPool");
const Chain_1 = require("./Chain");
const Wallet_1 = require("./Wallet");
const Miner_1 = require("./Miner");
class FullNode {
    constructor(options) {
        this.logger = new Logger_1.default({ context: 'FullNode' });
        this.chain = new Chain_1.default();
        this.txpool = new TxPool_1.default();
        this.pool = new Pool_1.default(options, this.txpool, this.chain);
        this.wallet = new Wallet_1.default(options, this.chain);
        this.miner = new Miner_1.default(this.txpool, this.chain, this.wallet.userKey);
        this.init();
    }
    init() {
        this.miner.on('block', (block) => {
            this.txpool.flushPending(block);
            this.pool.broadcastBlock(block);
        });
        this.pool.on('stop', () => {
            this.miner.stopMining();
        });
        this.wallet.on('tx', (tx) => {
            this.pool.broadcastTXs([tx]);
            this.txpool.add(tx);
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool.open();
            yield this.miner.open();
            this.logger.info('FullNode loaded');
        });
    }
    connect() {
        this.pool.connect();
    }
}
exports.default = FullNode;
//# sourceMappingURL=FullNode.js.map