"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Seeds_1 = require("./constants/Seeds");
const MAX_HOSTS = 10;
class AddrMan {
    constructor(option) {
        this.addr = option.addr;
        this.nodes = new Map();
        this.seeds = [];
        this.init(option);
    }
    init(option) {
        this.setSeeds(Seeds_1.DEFAULT_SEED);
        this.setNodes(option.nodes);
    }
    setSeeds(seeds) {
        for (const seed of seeds) {
            if (this.isOurAddr(seed))
                break;
            this.nodes.set(seed.toString(), seed);
            this.seeds.push(seed);
        }
    }
    setNodes(nodes) {
        for (const node of nodes) {
            this.add(node);
        }
    }
    add(addr) {
        if (this.isOurAddr(addr))
            return;
        if (this.nodes.get(addr.toString()))
            return;
        this.nodes.set(addr.toString(), addr);
    }
    remove(addr) {
        this.nodes.delete(addr.toString());
    }
    toArray() {
        const arr = [];
        this.nodes.forEach((node) => {
            arr.push(node);
        });
        return arr;
    }
    isOurAddr(addr) {
        return this.addr.toString() === addr.toString();
    }
    isFull() {
        return this.nodes.size === MAX_HOSTS;
    }
}
exports.default = AddrMan;
//# sourceMappingURL=AddrMan.js.map