import { DEFAULT_SEED } from './constants/Seeds';
import { Options } from './types/Options';
import Address from './Address';

const MAX_HOSTS = 10;

/**
 * Used for address management (banning, seeds, nodes, etc...).
 */
class AddrMan {
  addr: Address;
  nodes: Map<String, Address>;
  seeds: Address[];

  constructor(option: Options) {
    this.addr = option.addr;
    this.nodes = new Map();
    this.seeds = [];

    this.init(option);
  }

  /**
   * Init seeds and nodes
   */
  init(option: Options) {
    this.setSeeds(DEFAULT_SEED);
    this.setNodes(option.nodes);
  }

  /**
   * Set seeds to hostlist
   */
  setSeeds(seeds: Address[]) {
    for (const seed of seeds) {
      // Ignore if we are the seed
      if (this.isOurAddr(seed)) break;
      this.nodes.set(seed.toString(), seed);
      this.seeds.push(seed);
    }
  }

  /**
   * Set nodes to hostlist
   */
  setNodes(nodes: Address[]) {
    for (const node of nodes) {
      this.add(node);
    }
  }

  /**
   * Add an address
   */
  add(addr: Address) {
    if (this.isOurAddr(addr)) return;
    if (this.nodes.get(addr.toString())) return;
    this.nodes.set(addr.toString(), addr);
  }

  /**
   * Remove an address
   */
  remove(addr: Address) {
    this.nodes.delete(addr.toString());
  }

  /**
   * Return address as a list
   */
  toArray(): Address[] {
    const arr = [];
    this.nodes.forEach((node) => {
      arr.push(node);
    });
    return arr;
  }

  /**
   * Check if address is our address
   */
  isOurAddr(addr: Address) {
    return this.addr.toString() === addr.toString();
  }

  /**
   * Check if we are at max host capacity
   */
  isFull() {
    return this.nodes.size === MAX_HOSTS;
  }
}

export default AddrMan;
