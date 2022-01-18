import EventEmitter = require('events');
import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';
import { assert } from 'console';
import { Packet, PACKET_TYPES } from './types/Packet';
import { InvItem, INV_TYPES } from './types/InvItem';
import Logger from './utils/Logger';
import Address from './Address';
import Block from './Block';
import Transaction from './Transaction';

const PING_INTERVAL = 120000;
const INV_QUEUE_MAX = 1;

/**
 * A peer is a network abstraction unit.
 */
class Peer extends EventEmitter {
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

  constructor(addr: Address, isInBound: boolean) {
    super();
    this.logger = new Logger({ context: 'Peer' });
    this.isInBound = isInBound;
    this.addr = addr;
    this.destroyed = false;
    this.challange = null;
    this.lastPing = -1;
    this.lastPong = -1;
    this.invQueue = [];
  }

  /**
   * Changes InBound state
   */
  changeInBoundState(addr: Address) {
    this.isInBound = false;
    this.addr = addr;
  }

  /**
   * Bind socket events to peer
   */
  bind(ws: WebSocket) {
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

  /**
   * Loading clocks
   */
  open() {
    this.startTimeoutClock();
    this.startPingClock();
  }

  /**
   * Check inactivity of peer
   */
  startTimeoutClock() {
    assert(this.timeoutClock == null, 'Timeout clock already started');
    this.timeoutClock = setInterval(() => this.checkTimeout(), PING_INTERVAL);
  }

  /**
   * Send regularly ping message to peer
   */
  startPingClock() {
    assert(this.pingClock == null, 'Ping clock already started');
    this.pingClock = setInterval(() => this.sendPing(), PING_INTERVAL);
  }

  /**
   * Check if peer is inactive
   */
  checkTimeout() {
    const now = Date.now();

    // TODO: Maybe change the timeout time
    if (this.challange && now > this.lastPing + 2 * 60000) {
      this.destroy();
      return;
    }
  }

  /**
   * Sends a ping message
   */
  sendPing() {
    if (this.challange) {
      this.logger.debug('Previous PING challange not resolved');
      return;
    }

    this.logger.debug('Sending PING message');

    this.challange = uuidv4();
    this.lastPing = Date.now();

    this.send({ type: PACKET_TYPES.PING, payload: this.challange });
  }

  /**
   * Destroy peer
   */
  destroy() {
    if (this.destroyed) return;

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

  /**
   * Send packet to peer
   */
  send(packet: Packet) {
    this.socket.send(JSON.stringify(packet));
  }

  /**
   * Read peer packet
   */
  readPacket(packet: string) {
    try {
      const parsedPacket = JSON.parse(packet);
      this.handlePacket(parsedPacket);
    } catch (err) {
      // JSON Parse errors
      console.log(err);
    }
  }

  /**
   * Handle packet
   */
  handlePacket(packet: Packet) {
    switch (packet.type) {
      case PACKET_TYPES.PING:
        this.handlePing(packet.payload);
        break;
      case PACKET_TYPES.PONG:
        this.handlePong(packet.payload);
        break;
    }

    this.emit('packet', packet);
  }

  /**
   * Handle ping message
   */
  handlePing(nonce: number) {
    if (!nonce) return;

    this.send({ type: PACKET_TYPES.PONG, payload: nonce });
  }

  /**
   * Handle pong message
   */
  handlePong(nonce: number) {
    if (!this.challange) return;
    if (this.challange !== nonce) return;

    const now = Date.now();
    if (now < this.lastPing) return;

    this.lastPong = now;
    this.challange = null;
  }

  /**
   * Broadcast transactions
   */
  broadcastTXs(txs: Transaction[]) {
    const inv = [];
    for (const tx of txs) {
      inv.push({ type: INV_TYPES.TX, hash: tx.hash });
    }
    this.broadcast(inv);
  }

  /**
   * Broadcast block
   */
  broadcastBlock(blocks: Block[]) {
    const inv = [];
    for (const block of blocks) {
      inv.push({ type: INV_TYPES.BLOCK, hash: block.hash });
    }
    this.broadcast(inv);
  }

  /**
   * Broadcast
   */
  broadcast(items: InvItem[]) {
    let hasBlock = false;

    for (const item of items) {
      this.invQueue.push(item);

      // Immediately broadcast blocks
      if (item.type === INV_TYPES.BLOCK) hasBlock = true;
    }

    // TODO: increase INV_QUEUE_MAX when transaction load is bigger
    if (this.invQueue.length >= INV_QUEUE_MAX || hasBlock) this.flushInv();
  }

  /**
   * Flush the INV queue
   */
  flushInv() {
    if (!this.invQueue.length) return;

    this.logger.debug('Sending INV message');
    this.send({ type: PACKET_TYPES.INV, payload: this.invQueue });

    this.invQueue = [];
  }

  /**
   * Send GETDATA message
   */
  getData(invType: INV_TYPES, hashes: string[]) {
    this.send({
      type: PACKET_TYPES.GETDATA,
      payload: hashes.map((hash) => ({ type: invType, hash })),
    });
  }
}

export default Peer;
