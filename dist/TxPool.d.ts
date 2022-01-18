/// <reference types="node" />
import EventEmitter = require('events');
import Logger from './utils/Logger';
import Transaction from './Transaction';
import Block from './Block';
declare class TxPool extends EventEmitter {
    logger: Logger;
    pending: Map<String, Transaction>;
    constructor();
    add(tx: Transaction): void;
    has(hash: string): boolean;
    get(hash: string): Transaction;
    toArray(): any[];
    flushPending(block: Block): void;
}
export default TxPool;
