import UserKey from './UserKey';
declare class Transaction {
    hash: string;
    from: string;
    to: string;
    signature: string;
    amount: number;
    timestamp: number;
    constructor(from: string, to: string, amount: number, timestamp: number, signature?: string);
    static createCoinbaseTx(to: string): Transaction;
    calculateHash(): string;
    signTransaction(userKey: UserKey): void;
    isValid(): boolean;
    isCoinbase(): boolean;
    toString(): string;
}
export default Transaction;
