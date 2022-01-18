import { Options } from './types/Options';
import Logger from './utils/Logger';
import Pool from './Pool';
import TxPool from './TxPool';
import Chain from './Chain';
import Wallet from './Wallet';
import Miner from './Miner';
declare class FullNode {
    logger: Logger;
    pool: Pool;
    txpool: TxPool;
    chain: Chain;
    wallet: Wallet;
    miner: Miner;
    constructor(options: Options);
    init(): void;
    open(): Promise<void>;
    connect(): void;
}
export default FullNode;
