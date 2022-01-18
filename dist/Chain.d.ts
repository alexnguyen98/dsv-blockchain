/// <reference types="node" />
import EventEmitter = require('events');
import Logger from './utils/Logger';
import Block from './Block';
declare class Chain extends EventEmitter {
    logger: Logger;
    blocks: Block[];
    constructor();
    open(): void;
    getLatestBlock(): Block;
    isChainValid(): boolean;
    balance(account: string): number;
    add(block: Block): void;
    getBlock(hash: string): Block;
    has(hash: string): boolean;
    handleBlock(block: Block): void;
}
export default Chain;
