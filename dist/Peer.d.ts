/// <reference types="node" />
import EventEmitter = require('events');
import { WebSocket } from 'ws';
import { Packet } from './types/Packet';
import { InvItem, INV_TYPES } from './types/InvItem';
import Logger from './utils/Logger';
import Address from './Address';
import Block from './Block';
import Transaction from './Transaction';
declare class Peer extends EventEmitter {
    logger: Logger;
    socket: WebSocket;
    addr: Address;
    invQueue: InvItem[];
    challange: number;
    lastPing: number;
    lastPong: number;
    isInBound: boolean;
    destroyed: boolean;
    timeoutClock: any;
    pingClock: any;
    constructor(addr: Address, isInBound: boolean);
    changeInBoundState(addr: Address): void;
    bind(ws: WebSocket): void;
    open(): void;
    startTimeoutClock(): void;
    startPingClock(): void;
    checkTimeout(): void;
    sendPing(): void;
    destroy(): void;
    send(packet: Packet): void;
    readPacket(packet: string): void;
    handlePacket(packet: Packet): void;
    handlePing(nonce: number): void;
    handlePong(nonce: number): void;
    broadcastTXs(txs: Transaction[]): void;
    broadcastBlock(blocks: Block[]): void;
    broadcast(items: InvItem[]): void;
    flushInv(): void;
    getData(invType: INV_TYPES, hashes: string[]): void;
}
export default Peer;
