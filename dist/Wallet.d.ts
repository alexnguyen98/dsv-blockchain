/// <reference types="node" />
import EventEmitter = require('events');
import { Options } from './types/Options';
import Logger from './utils/Logger';
import Chain from './Chain';
import UserKey from './UserKey';
declare class Wallet extends EventEmitter {
    logger: Logger;
    userKey: UserKey;
    chain: Chain;
    constructor(options: Options, chain: Chain);
    send(to: string, amount: number): void;
    balance(): number;
}
export default Wallet;
