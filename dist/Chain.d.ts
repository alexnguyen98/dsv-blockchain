/// <reference types="node" />
import EventEmitter = require('events');
import Logger from './utils/Logger';
import Block from './Block';
import Peer from './Peer';
declare class Chain extends EventEmitter {
    logger: Logger;
    blocks: Block[];
    constructor();
    open(): void;
    getLatestBlock(): Block;
    isChainValid(): boolean;
    balance(account: string): number;
    add(block: Block, peer?: Peer): void;
    getBlock(hash: string): Block;
    has(hash: string): boolean;
    handleBlock(block: Block): void;
    resync(): void;
}
export default Chain;
