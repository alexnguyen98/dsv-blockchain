import Transaction from './Transaction';
declare class Block {
    hash: string;
    previousHash: string;
    timestamp: number;
    height: number;
    nonce: number;
    txs: Transaction[];
    constructor(previousHash: string, timestamp: number, height: number, txs: Transaction[], hash?: string, nonce?: number);
    static createGenesisBlock(): Block;
    isValid(): boolean;
    addTX(tx: Transaction): void;
    getPayload(): string;
}
export default Block;
