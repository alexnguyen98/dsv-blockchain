/// <reference types="node" />
import EventEmitter = require('events');
import { Worker } from 'worker_threads';
import Logger from './utils/Logger';
import Block from './Block';
import Chain from './Chain';
import Pool from './Pool';
import TxPool from './TxPool';
import UserKey from './UserKey';
declare class Miner extends EventEmitter {
    logger: Logger;
    txpool: TxPool;
    pool: Pool;
    chain: Chain;
    worker: Worker;
    block: Block;
    userKey: UserKey;
    mining: boolean;
    constructor(txpool: TxPool, chain: Chain, userKey: UserKey);
    open(): Promise<void>;
    handleTx(): void;
    addCoinbaseTx(block: Block): void;
    createBlockTemplate(): Block;
    mineCoinbaseBlock(): void;
    mineBlock(block: Block): void;
    createWorker(): void;
    handleBlockMined({ nonce, hash }: {
        nonce: number;
        hash: string;
    }): void;
    stopMining(): void;
    stopWorker(): void;
}
export default Miner;
