/// <reference types="node" />
import EventEmitter = require('events');
import { WebSocketServer, WebSocket } from 'ws';
import { Socket } from 'net';
import { Packet } from './types/Packet';
import { Options } from './types/Options';
import { InvItem } from './types/InvItem';
import Address from './Address';
import Peer from './Peer';
import AddrMan from './AddrMan';
import Logger from './utils/Logger';
import Transaction from './Transaction';
import Block from './Block';
import TxPool from './TxPool';
import Chain from './Chain';
declare class Pool extends EventEmitter {
    logger: Logger;
    txpool: TxPool;
    chain: Chain;
    addrMan: AddrMan;
    server: WebSocketServer;
    peers: Map<String, Peer>;
    maxConnections: number;
    listening: boolean;
    opened: boolean;
    connected: boolean;
    refillClock: any;
    constructor(options: Options, txpool: TxPool, chain: Chain);
    open(): Promise<void>;
    close(): Promise<void>;
    connect(): Promise<void>;
    openServer(): void;
    handleConnect(ws: WebSocket, socket: Socket): void;
    fillOutBound(): void;
    getHost(): Address;
    bind(peer: Peer): void;
    addOutBoundPeer(): void;
    addInBoundPeer(ws: WebSocket, socket: Socket): void;
    refillPeers(): void;
    handlePeerConnect(peer: Peer): void;
    handlePeerClose(peer: Peer): void;
    handlePacket(peer: Peer, packet: Packet): void;
    handleAddr(peer: Peer, payload: {
        addr?: {
            ip: string;
            port: number;
        };
        nodes: {
            ip: string;
            port: number;
        }[];
    }): void;
    handleGetAddr(peer: Peer): void;
    handleInv(peer: Peer, payload: InvItem[]): void;
    handleInvTx(peer: Peer, hashes: string[]): void;
    handleInvBlock(peer: Peer, hashes: string[]): void;
    handleGetData(peer: Peer, payload: InvItem[]): void;
    handleTX(peer: Peer, payload: any): void;
    handleBlock(peer: Peer, payload: any): void;
    handleGetBlock(peer: Peer, payload: string): void;
    startRefillClock(): void;
    stopRefillClock(): void;
    broadcastTXs(txs: Transaction[]): void;
    broadcastBlock(block: Block): void;
    resyncBlocks(): void;
}
export default Pool;
