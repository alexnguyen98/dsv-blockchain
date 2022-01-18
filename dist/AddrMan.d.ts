import { Options } from './types/Options';
import Address from './Address';
declare class AddrMan {
    addr: Address;
    nodes: Map<String, Address>;
    seeds: Address[];
    constructor(option: Options);
    init(option: Options): void;
    setSeeds(seeds: Address[]): void;
    setNodes(nodes: Address[]): void;
    add(addr: Address): void;
    remove(addr: Address): void;
    toArray(): Address[];
    isOurAddr(addr: Address): boolean;
    isFull(): boolean;
}
export default AddrMan;
