import Address from './Address';
declare class UserKey {
    publicKey: string;
    privateKey: string;
    constructor(addr: Address, id: string);
    static sign(msg: string, privateKey: string): string;
    static verify(msg: string, signature: string, publicKey: string): boolean;
}
export default UserKey;
