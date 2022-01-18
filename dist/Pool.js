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
const console_1 = require("console");
const ws_1 = require("ws");
const Packet_1 = require("./types/Packet");
const InvItem_1 = require("./types/InvItem");
const Address_1 = require("./Address");
const Peer_1 = require("./Peer");
const AddrMan_1 = require("./AddrMan");
const Logger_1 = require("./utils/Logger");
const Transaction_1 = require("./Transaction");
const Block_1 = require("./Block");
const MAX_PEERS = 5;
const REFILL_INTERVAL = 60000;
class Pool extends EventEmitter {
    constructor(options, txpool, chain) {
        super();
        this.logger = new Logger_1.default({ context: 'Pool' });
        this.addrMan = new AddrMan_1.default(options);
        this.peers = new Map();
        this.txpool = txpool;
        this.chain = chain;
        this.maxConnections = MAX_PEERS;
        this.opened = false;
        this.connected = false;
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, console_1.assert)(!this.opened, 'Pool is already loaded');
            this.logger.info('Pool loaded');
            this.opened = true;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, console_1.assert)(this.opened, 'Pool is not loaded');
            this.opened = false;
            this.peers.forEach((peer) => peer.destroy());
            this.stopRefillClock();
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, console_1.assert)(!this.connected, 'Pool is already connected');
            this.openServer();
            this.fillOutBound();
            this.startRefillClock();
        });
    }
    openServer() {
        this.server = new ws_1.WebSocketServer({
            host: this.addrMan.addr.ip,
            port: this.addrMan.addr.port,
        });
        this.server.on('error', (err) => {
            this.logger.error(err.message);
        });
        this.server.on('connection', (ws, req) => {
            this.handleConnect(ws, req.socket);
        });
        this.server.on('listening', () => {
            this.logger.info(`Pool is listening on ${this.addrMan.addr.toString()}`);
        });
    }
    handleConnect(ws, socket) {
        if (!socket.remoteAddress) {
            this.logger.error('Ignoring disconnected peer');
            ws.close();
            return;
        }
        if (this.peers.size >= this.maxConnections) {
            this.logger.error('Too many peers');
            ws.close();
            return;
        }
        const addr = new Address_1.default(socket.remoteAddress, socket.remotePort);
        if (this.peers.has(addr.toString())) {
            this.logger.error('Peer has port collision');
            ws.close();
            return;
        }
        this.addInBoundPeer(ws, socket);
    }
    fillOutBound() {
        const need = this.maxConnections - this.peers.size;
        if (need <= 0)
            return;
        for (let i = 0; i < need; i++) {
            this.addOutBoundPeer();
        }
    }
    getHost() {
        for (const node of this.addrMan.toArray()) {
            if (this.peers.has(node.toString()))
                continue;
            return node;
        }
    }
    bind(peer) {
        peer.on('packet', (packet) => {
            this.handlePacket(peer, packet);
        });
        peer.once('connect', () => {
            this.handlePeerConnect(peer);
        });
        peer.once('close', () => {
            this.handlePeerClose(peer);
        });
    }
    addOutBoundPeer() {
        const addr = this.getHost();
        if (!addr)
            return;
        if (this.peers.has(addr.toString()))
            return;
        if (this.addrMan.isOurAddr(addr)) {
            this.logger.error('Oops, we connected to ourself');
            return;
        }
        const peer = new Peer_1.default(addr, false);
        this.logger.info(`Adding outbound peer ${addr.ip}:${addr.port}`);
        this.bind(peer);
        peer.bind(new ws_1.WebSocket(`ws://${addr.toString()}`));
        peer.open();
        this.peers.set(addr.toString(), peer);
    }
    addInBoundPeer(ws, socket) {
        if (!this.opened) {
            ws.close();
            return;
        }
        const peer = new Peer_1.default(new Address_1.default(socket.remoteAddress, socket.remotePort), true);
        this.logger.info(`Adding inbound peer ${peer.addr.ip}:${peer.addr.port}`);
        this.bind(peer);
        peer.bind(ws);
        peer.open();
    }
    refillPeers() {
        this.logger.debug('Refilling peers');
        this.fillOutBound();
    }
    handlePeerConnect(peer) {
        this.logger.info(`Connected to ${peer.addr.ip}:${peer.addr.port}`);
        this.logger.debug(`Sending ADDR packet to ${peer.addr.ip}:${peer.addr.port}`);
        peer.send({
            type: Packet_1.PACKET_TYPES.ADDR,
            payload: { addr: this.addrMan.addr, nodes: this.addrMan.toArray() },
        });
        if (!this.addrMan.isFull()) {
            this.logger.debug(`Sending GETADDR packet to ${peer.addr.ip}:${peer.addr.port}`);
            peer.send({ type: Packet_1.PACKET_TYPES.GETADDR });
        }
        this.logger.debug(`Sending GETBLOCKS packet to ${peer.addr.ip}:${peer.addr.port}`);
        peer.send({
            type: Packet_1.PACKET_TYPES.GETBLOCKS,
            payload: this.chain.getLatestBlock().hash,
        });
    }
    handlePeerClose(peer) {
        this.logger.info(`Peer connection closed ${peer.addr.ip}:${peer.addr.port}`);
        this.peers.delete(peer.addr.toString());
        this.addrMan.remove(peer.addr);
        this.refillPeers();
    }
    handlePacket(peer, packet) {
        switch (packet.type) {
            case Packet_1.PACKET_TYPES.ADDR:
                this.logger.debug('Recieved ADDR message');
                this.handleAddr(peer, packet.payload);
                break;
            case Packet_1.PACKET_TYPES.GETADDR:
                this.logger.debug('Recieved GETADDR message');
                this.handleGetAddr(peer);
                break;
            case Packet_1.PACKET_TYPES.INV:
                this.logger.debug('Recieved INV message');
                this.handleInv(peer, packet.payload);
                break;
            case Packet_1.PACKET_TYPES.GETDATA:
                this.logger.debug('Recieved GETDATA message');
                this.handleGetData(peer, packet.payload);
                break;
            case Packet_1.PACKET_TYPES.TX:
                this.logger.debug('Recieved TX data');
                this.handleTX(peer, packet.payload);
                break;
            case Packet_1.PACKET_TYPES.BLOCK:
                this.logger.debug('Recieved block data');
                this.handleBlock(peer, packet.payload);
                break;
            case Packet_1.PACKET_TYPES.GETBLOCKS:
                this.logger.debug('Recieved GETBLOCKS message');
                this.handleGetBlock(peer, packet.payload);
                break;
        }
    }
    handleAddr(peer, payload) {
        for (const node of payload.nodes) {
            this.addrMan.add(new Address_1.default(node.ip, node.port));
        }
        if (payload.addr) {
            const addr = new Address_1.default(payload.addr.ip, payload.addr.port);
            if (peer.isInBound && !this.peers.get(addr.toString())) {
                const addr = new Address_1.default(payload.addr.ip, payload.addr.port);
                peer.changeInBoundState(addr);
                this.peers.set(peer.addr.toString(), peer);
                this.addrMan.add(peer.addr);
            }
            if (payload.nodes.length < 3) {
                const arr = [...this.addrMan.toArray()]
                    .filter((node) => node.toString() !== addr.toString())
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 2);
                for (const i of arr) {
                    const peer = this.peers.get(i.toString());
                    this.logger.info(`Relaying ADDR message to peer ${peer.addr.ip}:${peer.addr.port}`);
                    peer.send({
                        type: Packet_1.PACKET_TYPES.ADDR,
                        payload: { nodes: this.addrMan.toArray() },
                    });
                }
            }
        }
        this.refillPeers();
    }
    handleGetAddr(peer) {
        const nodes = this.addrMan.toArray();
        if (!nodes.length)
            return;
        peer.send({ type: Packet_1.PACKET_TYPES.ADDR, payload: { nodes } });
    }
    handleInv(peer, payload) {
        const txs = [];
        const blocks = [];
        for (const item of payload) {
            if (item.type === InvItem_1.INV_TYPES.TX)
                txs.push(item.hash);
            else if (item.type === InvItem_1.INV_TYPES.BLOCK)
                blocks.push(item.hash);
        }
        if (txs.length)
            this.handleInvTx(peer, txs);
        if (blocks.length)
            this.handleInvBlock(peer, blocks);
    }
    handleInvTx(peer, hashes) {
        const items = [];
        for (const hash of hashes) {
            if (this.txpool.has(hash) == null)
                continue;
            items.push(hash);
        }
        peer.getData(InvItem_1.INV_TYPES.TX, hashes);
    }
    handleInvBlock(peer, hashes) {
        const items = [];
        for (const hash of hashes) {
            if (this.chain.has(hash) == null)
                continue;
            items.push(hash);
        }
        peer.getData(InvItem_1.INV_TYPES.BLOCK, hashes);
    }
    handleGetData(peer, payload) {
        let notFound = 0;
        for (const item of payload) {
            if (item.type === InvItem_1.INV_TYPES.TX) {
                const tx = this.txpool.get(item.hash);
                if (!tx) {
                    notFound++;
                    continue;
                }
                this.logger.debug(`Sending TX to peer ${peer.addr.toString()}`);
                peer.send({ type: Packet_1.PACKET_TYPES.TX, payload: tx });
            }
            else if (item.type === InvItem_1.INV_TYPES.BLOCK) {
                const block = this.chain.getBlock(item.hash);
                if (!block) {
                    notFound++;
                    continue;
                }
                this.logger.debug(`Sending BLOCK to peer ${peer.addr.toString()}`);
                peer.send({ type: Packet_1.PACKET_TYPES.BLOCK, payload: block });
            }
        }
        if (notFound > 0) {
            this.logger.debug('Couldnt find certain INV items');
        }
    }
    handleTX(peer, payload) {
        const tx = new Transaction_1.default(payload.from, payload.to, payload.amount, payload.timestamp, payload.signature);
        if (this.txpool.has(tx.hash)) {
            this.logger.error('Already have the transaction');
            peer.destroy();
            return;
        }
        if (!tx.isValid) {
            this.logger.error('Transaction invalid');
            peer.destroy();
            return;
        }
        this.logger.debug('Recieved transactions');
        this.txpool.add(tx);
    }
    handleBlock(peer, payload) {
        const block = new Block_1.default(payload.previousHash, payload.timestamp, payload.height, [], payload.hash, payload.nonce);
        for (const tx of payload.txs) {
            block.addTX(new Transaction_1.default(tx.from, tx.to, tx.amount, tx.timestamp, tx.signature));
        }
        if (this.chain.has(block.hash)) {
            this.logger.error('Already have the block');
            peer.destroy();
            return;
        }
        if (!block.isValid()) {
            this.logger.error('Block invalid');
            peer.destroy();
            return;
        }
        if (block.height === this.chain.blocks.length + 1) {
            this.emit('stop');
        }
        this.logger.debug('Recieved blocks');
        this.chain.add(block);
    }
    handleGetBlock(peer, payload) {
        if (!this.chain.has(payload))
            return;
        const inv = [];
        let foundIndex = 0;
        for (let i = this.chain.blocks.length - 1; i >= 0; i--) {
            if (this.chain.blocks[i].hash === payload) {
                foundIndex = i;
                break;
            }
        }
        for (let i = foundIndex + 1; i < this.chain.blocks.length; i++) {
            inv.push({ type: InvItem_1.INV_TYPES.BLOCK, hash: this.chain.blocks[i].hash });
        }
        if (inv.length) {
            this.logger.debug('Sending INV message for block sync');
            peer.send({ type: Packet_1.PACKET_TYPES.INV, payload: inv });
        }
    }
    startRefillClock() {
        (0, console_1.assert)(this.refillClock == null, 'Refill clock already started');
        this.refillClock = setInterval(() => this.refillPeers(), REFILL_INTERVAL);
    }
    stopRefillClock() {
        (0, console_1.assert)(this.refillClock != null, 'Refill clock already stoped');
        clearInterval(this.refillClock);
        this.refillClock = null;
    }
    broadcastTXs(txs) {
        this.logger.debug('Broadcasting transactions');
        this.peers.forEach((peer) => {
            peer.broadcastTXs(txs);
        });
    }
    broadcastBlock(block) {
        this.logger.debug('Broadcasting blocks');
        this.peers.forEach((peer) => {
            peer.broadcastBlock([block]);
        });
    }
    resyncBlocks() {
        const peer = this.peers[Math.floor(Math.random() * this.peers.size)];
        this.logger.debug(`Resync - sending GETBLOCKS packet to ${peer.addr.ip}:${peer.addr.port}`);
        peer.send({
            type: Packet_1.PACKET_TYPES.GETBLOCKS,
            payload: this.chain.getLatestBlock().hash,
        });
    }
}
exports.default = Pool;
//# sourceMappingURL=Pool.js.map