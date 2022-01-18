"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const uuid_1 = require("uuid");
const console_1 = require("console");
const Packet_1 = require("./types/Packet");
const InvItem_1 = require("./types/InvItem");
const Logger_1 = require("./utils/Logger");
const PING_INTERVAL = 120000;
const INV_QUEUE_MAX = 1;
class Peer extends EventEmitter {
    constructor(addr, isInBound) {
        super();
        this.logger = new Logger_1.default({ context: 'Peer' });
        this.isInBound = isInBound;
        this.addr = addr;
        this.destroyed = false;
        this.challange = null;
        this.lastPing = -1;
        this.lastPong = -1;
        this.invQueue = [];
    }
    changeInBoundState(addr) {
        this.isInBound = false;
        this.addr = addr;
    }
    bind(ws) {
        this.socket = ws;
        this.socket.on('error', (err) => {
            this.logger.error(err.message);
        });
        this.socket.once('close', () => {
            this.destroy();
        });
        this.socket.once('open', () => {
            this.emit('connect');
        });
        this.socket.on('message', (data) => {
            this.readPacket(data.toString('utf-8'));
        });
    }
    open() {
        this.startTimeoutClock();
        this.startPingClock();
    }
    startTimeoutClock() {
        (0, console_1.assert)(this.timeoutClock == null, 'Timeout clock already started');
        this.timeoutClock = setInterval(() => this.checkTimeout(), PING_INTERVAL);
    }
    startPingClock() {
        (0, console_1.assert)(this.pingClock == null, 'Ping clock already started');
        this.pingClock = setInterval(() => this.sendPing(), PING_INTERVAL);
    }
    checkTimeout() {
        const now = Date.now();
        if (this.challange && now > this.lastPing + 2 * 60000) {
            this.destroy();
            return;
        }
    }
    sendPing() {
        if (this.challange) {
            this.logger.debug('Previous PING challange not resolved');
            return;
        }
        this.logger.debug('Sending PING message');
        this.challange = (0, uuid_1.v4)();
        this.lastPing = Date.now();
        this.send({ type: Packet_1.PACKET_TYPES.PING, payload: this.challange });
    }
    destroy() {
        if (this.destroyed)
            return;
        if (this.timeoutClock != null) {
            clearInterval(this.timeoutClock);
            this.timeoutClock = null;
        }
        if (this.pingClock != null) {
            clearInterval(this.pingClock);
            this.pingClock = null;
        }
        this.socket.close();
        this.socket = null;
        this.destroyed = true;
        this.emit('close');
    }
    send(packet) {
        this.socket.send(JSON.stringify(packet));
    }
    readPacket(packet) {
        try {
            const parsedPacket = JSON.parse(packet);
            this.handlePacket(parsedPacket);
        }
        catch (err) {
            console.log(err);
        }
    }
    handlePacket(packet) {
        switch (packet.type) {
            case Packet_1.PACKET_TYPES.PING:
                this.handlePing(packet.payload);
                break;
            case Packet_1.PACKET_TYPES.PONG:
                this.handlePong(packet.payload);
                break;
        }
        this.emit('packet', packet);
    }
    handlePing(nonce) {
        if (!nonce)
            return;
        this.send({ type: Packet_1.PACKET_TYPES.PONG, payload: nonce });
    }
    handlePong(nonce) {
        if (!this.challange)
            return;
        if (this.challange !== nonce)
            return;
        const now = Date.now();
        if (now < this.lastPing)
            return;
        this.lastPong = now;
        this.challange = null;
    }
    broadcastTXs(txs) {
        const inv = [];
        for (const tx of txs) {
            inv.push({ type: InvItem_1.INV_TYPES.TX, hash: tx.hash });
        }
        this.broadcast(inv);
    }
    broadcastBlock(blocks) {
        const inv = [];
        for (const block of blocks) {
            inv.push({ type: InvItem_1.INV_TYPES.BLOCK, hash: block.hash });
        }
        this.broadcast(inv);
    }
    broadcast(items) {
        let hasBlock = false;
        for (const item of items) {
            this.invQueue.push(item);
            if (item.type === InvItem_1.INV_TYPES.BLOCK)
                hasBlock = true;
        }
        if (this.invQueue.length >= INV_QUEUE_MAX || hasBlock)
            this.flushInv();
    }
    flushInv() {
        if (!this.invQueue.length)
            return;
        this.logger.debug('Sending INV message');
        this.send({ type: Packet_1.PACKET_TYPES.INV, payload: this.invQueue });
        this.invQueue = [];
    }
    getData(invType, hashes) {
        this.send({
            type: Packet_1.PACKET_TYPES.GETDATA,
            payload: hashes.map((hash) => ({ type: invType, hash })),
        });
    }
}
exports.default = Peer;
//# sourceMappingURL=Peer.js.map