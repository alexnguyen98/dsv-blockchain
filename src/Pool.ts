import EventEmitter = require('events');
import { assert } from 'console';
import { WebSocketServer, WebSocket } from 'ws';
import { Socket } from 'net';
import { Packet, PACKET_TYPES } from './types/Packet';
import { Options } from './types/Options';
import { InvItem, INV_TYPES } from './types/InvItem';
import Address from './Address';
import Peer from './Peer';
import AddrMan from './AddrMan';
import Logger from './utils/Logger';
import Transaction from './Transaction';
import Block from './Block';
import TxPool from './TxPool';
import Chain from './Chain';

const MAX_PEERS = 5;
const REFILL_INTERVAL = 60000;

/**
 * A pool of peers for handling all network activity.
 */
class Pool extends EventEmitter {
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

  constructor(options: Options, txpool: TxPool, chain: Chain) {
    super();

    this.logger = new Logger({ context: 'Pool' });
    this.addrMan = new AddrMan(options);
    this.peers = new Map();

    this.txpool = txpool;
    this.chain = chain;

    this.maxConnections = MAX_PEERS;

    this.opened = false;
    this.connected = false;
  }
  /**
   * Load pool
   */
  async open() {
    assert(!this.opened, 'Pool is already loaded');
    this.logger.info('Pool loaded');
    this.opened = true;
  }

  /**
   * Close pool
   */
  async close() {
    assert(this.opened, 'Pool is not loaded');
    this.opened = false;
    this.peers.forEach((peer) => peer.destroy());
    this.stopRefillClock();
  }

  /**
   * Connect to the network
   */
  async connect() {
    assert(!this.connected, 'Pool is already connected');
    this.openServer();
    this.fillOutBound();

    this.startRefillClock();
  }

  /**
   * Opening and binding listeners on websocket server
   */
  openServer() {
    this.server = new WebSocketServer({
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

  /**
   * Handling incomming peer
   */
  handleConnect(ws: WebSocket, socket: Socket) {
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

    const addr = new Address(socket.remoteAddress, socket.remotePort);
    if (this.peers.has(addr.toString())) {
      this.logger.error('Peer has port collision');
      ws.close();
      return;
    }

    this.addInBoundPeer(ws, socket);
  }

  /**
   * Fill missing
   */
  fillOutBound() {
    const need = this.maxConnections - this.peers.size;

    if (need <= 0) return;

    for (let i = 0; i < need; i++) {
      this.addOutBoundPeer();
    }
  }

  /**
   * Get a addr that isnt a peer yet
   */
  getHost() {
    for (const node of this.addrMan.toArray()) {
      if (this.peers.has(node.toString())) continue;
      return node;
    }
  }

  /**
   * Bind peer to events
   */
  bind(peer: Peer) {
    peer.on('packet', (packet: Packet) => {
      this.handlePacket(peer, packet);
    });

    peer.once('connect', () => {
      this.handlePeerConnect(peer);
    });

    peer.once('close', () => {
      this.handlePeerClose(peer);
    });
  }

  /**
   * Peer we coonected to
   */
  addOutBoundPeer() {
    const addr = this.getHost();

    if (!addr) return;
    if (this.peers.has(addr.toString())) return;
    if (this.addrMan.isOurAddr(addr)) {
      this.logger.error('Oops, we connected to ourself');
      return;
    }

    const peer = new Peer(addr, false);

    this.logger.info(`Adding outbound peer ${addr.ip}:${addr.port}`);

    this.bind(peer);
    peer.bind(new WebSocket(`ws://${addr.toString()}`));
    peer.open();

    this.peers.set(addr.toString(), peer);
  }

  /**
   * Peer connected to us
   */
  addInBoundPeer(ws: WebSocket, socket: Socket) {
    if (!this.opened) {
      ws.close();
      return;
    }

    const peer = new Peer(
      new Address(socket.remoteAddress, socket.remotePort),
      true,
    );

    this.logger.info(`Adding inbound peer ${peer.addr.ip}:${peer.addr.port}`);

    this.bind(peer);
    peer.bind(ws);
    peer.open();
  }

  refillPeers() {
    this.logger.debug('Refilling peers');
    this.fillOutBound();
  }

  /**
   * Handle peer initialisation
   */
  handlePeerConnect(peer: Peer) {
    this.logger.info(`Connected to ${peer.addr.ip}:${peer.addr.port}`);

    // Advertise our address
    this.logger.debug(
      `Sending ADDR packet to ${peer.addr.ip}:${peer.addr.port}`,
    );
    peer.send({
      type: PACKET_TYPES.ADDR,
      payload: { addr: this.addrMan.addr, nodes: this.addrMan.toArray() },
    });

    // Fnd more hosts
    if (!this.addrMan.isFull()) {
      this.logger.debug(
        `Sending GETADDR packet to ${peer.addr.ip}:${peer.addr.port}`,
      );
      peer.send({ type: PACKET_TYPES.GETADDR });
    }

    // Share the latest block we have to the peer
    this.logger.debug(
      `Sending GETBLOCKS packet to ${peer.addr.ip}:${peer.addr.port}`,
    );
    peer.send({
      type: PACKET_TYPES.GETBLOCKS,
      payload: this.chain.getLatestBlock().hash,
    });
  }

  /**
   * Handle peer close
   */
  handlePeerClose(peer: Peer) {
    this.logger.info(
      `Peer connection closed ${peer.addr.ip}:${peer.addr.port}`,
    );
    this.peers.delete(peer.addr.toString());
    this.addrMan.remove(peer.addr);

    this.refillPeers();
  }

  /**
   * Handle peer packet
   */
  handlePacket(peer: Peer, packet: Packet) {
    switch (packet.type) {
      case PACKET_TYPES.ADDR:
        this.logger.debug('Recieved ADDR message');
        this.handleAddr(peer, packet.payload);
        break;
      case PACKET_TYPES.GETADDR:
        this.logger.debug('Recieved GETADDR message');
        this.handleGetAddr(peer);
        break;
      case PACKET_TYPES.INV:
        this.logger.debug('Recieved INV message');
        this.handleInv(peer, packet.payload);
        break;
      case PACKET_TYPES.GETDATA:
        this.logger.debug('Recieved GETDATA message');
        this.handleGetData(peer, packet.payload);
        break;
      case PACKET_TYPES.TX:
        this.logger.debug('Recieved TX data');
        this.handleTX(peer, packet.payload);
        break;
      case PACKET_TYPES.BLOCK:
        this.logger.debug('Recieved block data');
        this.handleBlock(peer, packet.payload);
        break;
      case PACKET_TYPES.GETBLOCKS:
        this.logger.debug('Recieved GETBLOCKS message');
        this.handleGetBlock(peer, packet.payload);
        break;
      case PACKET_TYPES.RESYNC:
        this.logger.debug('Recieved RESYNC message');
        this.handleResync();
        break;
    }
  }

  /**
   * Handle ADDR message
   */
  handleAddr(
    peer: Peer,
    payload: {
      addr?: { ip: string; port: number };
      nodes: { ip: string; port: number }[];
    },
  ) {
    // Update addrMan
    for (const node of payload.nodes) {
      this.addrMan.add(new Address(node.ip, node.port));
    }

    // Peer relay
    if (payload.addr) {
      const addr = new Address(payload.addr.ip, payload.addr.port);

      if (peer.isInBound && !this.peers.get(addr.toString())) {
        const addr = new Address(payload.addr.ip, payload.addr.port);
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
          this.logger.info(
            `Relaying ADDR message to peer ${peer.addr.ip}:${peer.addr.port}`,
          );
          peer.send({
            type: PACKET_TYPES.ADDR,
            payload: { nodes: this.addrMan.toArray() },
          });
        }
      }
    }

    this.refillPeers();
  }

  /**
   * Handle GETADDR message
   */
  handleGetAddr(peer: Peer) {
    const nodes = this.addrMan.toArray();

    if (!nodes.length) return;

    peer.send({ type: PACKET_TYPES.ADDR, payload: { nodes } });
  }

  /**
   * Handle INV message
   */
  handleInv(peer: Peer, payload: InvItem[]) {
    const txs = [];
    const blocks = [];

    for (const item of payload) {
      if (item.type === INV_TYPES.TX) txs.push(item.hash);
      else if (item.type === INV_TYPES.BLOCK) blocks.push(item.hash);
    }

    if (txs.length) this.handleInvTx(peer, txs);
    if (blocks.length) this.handleInvBlock(peer, blocks);
  }

  /**
   * Handle transactions from INV message
   */
  handleInvTx(peer: Peer, hashes: string[]) {
    const items = [];

    for (const hash of hashes) {
      if (this.txpool.has(hash) == null) continue;

      items.push(hash);
    }

    peer.getData(INV_TYPES.TX, hashes);
  }

  /*
   * Handle blocks from INV message
   */
  handleInvBlock(peer: Peer, hashes: string[]) {
    const items = [];

    for (const hash of hashes) {
      if (this.chain.has(hash) == null) continue;

      items.push(hash);
    }

    peer.getData(INV_TYPES.BLOCK, hashes);
  }

  /**
   * Handle GETDATA message
   */
  handleGetData(peer: Peer, payload: InvItem[]) {
    let notFound = 0;

    for (const item of payload) {
      if (item.type === INV_TYPES.TX) {
        const tx = this.txpool.get(item.hash);

        if (!tx) {
          notFound++;
          continue;
        }

        this.logger.debug(`Sending TX to peer ${peer.addr.toString()}`);
        peer.send({ type: PACKET_TYPES.TX, payload: tx });
      } else if (item.type === INV_TYPES.BLOCK) {
        const block = this.chain.getBlock(item.hash);

        if (!block) {
          notFound++;
          continue;
        }

        this.logger.debug(`Sending BLOCK to peer ${peer.addr.toString()}`);
        peer.send({ type: PACKET_TYPES.BLOCK, payload: block });
      }
    }

    if (notFound > 0) {
      this.logger.debug('Couldnt find certain INV items');
    }
  }

  /**
   * Handle TX data
   */
  handleTX(peer: Peer, payload: any) {
    const tx = new Transaction(
      payload.from,
      payload.to,
      payload.amount,
      payload.timestamp,
      payload.signature,
    );

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

  /**
   * Handle Block data
   */
  handleBlock(peer: Peer, payload: any) {
    const block = new Block(
      payload.previousHash,
      payload.timestamp,
      payload.height,
      [],
      payload.hash,
      payload.nonce,
    );
    for (const tx of payload.txs) {
      block.addTX(
        new Transaction(tx.from, tx.to, tx.amount, tx.timestamp, tx.signature),
      );
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

    // Added block totally out of sync, force to resync
    if (
      block.previousHash !== this.chain.getLatestBlock().hash &&
      block.previousHash !== this.chain.getLatestBlock().previousHash
    ) {
      peer.send({ type: PACKET_TYPES.RESYNC });
      return;
    }

    this.txpool.flushPending(block);
    this.chain.add(block, peer);
  }

  /**
   * Handle GETBLOCK message
   */
  handleGetBlock(peer: Peer, payload: string) {
    // Ignore if the peer has the latest block that we dont have
    if (!this.chain.has(payload)) return;

    const inv: InvItem[] = [];
    let foundIndex = 0;

    for (let i = this.chain.blocks.length - 1; i >= 0; i--) {
      if (this.chain.blocks[i].hash === payload) {
        foundIndex = i;
        break;
      }
    }

    for (let i = foundIndex + 1; i < this.chain.blocks.length; i++) {
      inv.push({ type: INV_TYPES.BLOCK, hash: this.chain.blocks[i].hash });
    }

    if (inv.length) {
      this.logger.debug('Sending INV message for block sync');
      peer.send({ type: PACKET_TYPES.INV, payload: inv });
    }
  }

  /**
   * Ask a random peer for new blocks to fix the chain
   */
  handleResync() {
    const peer = this.peers[Math.floor(Math.random() * this.peers.size)];
    this.logger.debug(
      `Resync - sending GETBLOCKS packet to ${peer.addr.ip}:${peer.addr.port}`,
    );
    this.chain.resync();
    peer.send({
      type: PACKET_TYPES.GETBLOCKS,
      payload: this.chain.getLatestBlock().hash,
    });
  }

  /**
   * Starts refilling peers from hosts
   */
  startRefillClock() {
    assert(this.refillClock == null, 'Refill clock already started');
    this.refillClock = setInterval(() => this.refillPeers(), REFILL_INTERVAL);
  }

  /**
   * Stop refilling
   */
  stopRefillClock() {
    assert(this.refillClock != null, 'Refill clock already stoped');
    clearInterval(this.refillClock);
    this.refillClock = null;
  }

  /**
   * Broadcasts TXs to peers
   */
  broadcastTXs(txs: Transaction[]) {
    this.logger.debug('Broadcasting transactions');

    this.peers.forEach((peer) => {
      peer.broadcastTXs(txs);
    });
  }

  /**
   * Broadcasts Block to peers
   */
  broadcastBlock(block: Block) {
    this.logger.debug('Broadcasting blocks');

    this.peers.forEach((peer) => {
      peer.broadcastBlock([block]);
    });
  }
}

export default Pool;
