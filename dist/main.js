"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const process_1 = require("process");
const FullNode_1 = require("./FullNode");
const Address_1 = require("./Address");
const rl = readline.createInterface({ input: process_1.stdin, output: process_1.stdout, terminal: false });
let fullNode;
const options = {
    id: '',
    addr: null,
    nodes: [],
};
const processArguments = () => __awaiter(void 0, void 0, void 0, function* () {
    process.argv.forEach((arg) => {
        if (arg.includes('--addr=')) {
            const split = arg.replace('--addr=', '').split(':');
            const ip = split[0];
            const port = parseInt(split[1]);
            if (!port || !ip)
                throw new Error('Unable to parse address');
            options.addr = new Address_1.default(ip, port);
        }
        else if (arg.includes('--connect=')) {
            const split = arg.replace('--connect=', '').split(',');
            split === null || split === void 0 ? void 0 : split.forEach((i) => {
                const s = i.split(':');
                const ip = s[0];
                const port = parseInt(s[1]);
                if (!port || !ip)
                    throw new Error('Unable to parse address');
                options.nodes.push(new Address_1.default(ip, port));
            });
        }
        else if (arg.includes('--id=')) {
            const id = arg.replace('--id=', '');
            if (!id)
                throw new Error('Unable to parse id');
            options.id = id;
        }
    });
    if (!options.addr || !options.id)
        throw new Error('Missing argument addr or id');
    fullNode = new FullNode_1.default(options);
});
const processComands = () => {
    rl.prompt();
    rl.on('line', (line) => {
        if (line.includes('tx') && line.includes('-to=') && line.includes('-am=')) {
            let to, am;
            line.split(' ').forEach((i) => {
                if (i.includes('-to=')) {
                    to = i.split('=')[1];
                }
                else if (i.includes('-am=')) {
                    am = parseInt(i.split('=')[1]);
                }
            });
            console.log('=======================================');
            console.log(`transaction to ${to} with the amount ${am}`);
            fullNode.wallet.send(to, am);
        }
        else {
            switch (line.trim()) {
                case '--help':
                    console.log(`- 'peers ls'                        get the list of addr of connected peers`);
                    console.log(`- 'addrMan ls'                      get the list of hosts`);
                    console.log(`- 'tx -to=<addr> -am=<amount>'      send a transaction to address`);
                    console.log(`- 'mine-empty'                      mine empty block to get bitcoin`);
                    console.log(`- 'wallet balance'                  get current balance`);
                    console.log(`- 'wallet addr'                     wallet address ie public key`);
                    console.log(`- 'chain valid'                     check if chain is valid`);
                    console.log(`- 'chain ls'                        get info of all blocks in chain`);
                    console.log(`- 'txpool ls'                       get list of pending transactions`);
                    break;
                case 'peers ls':
                    console.log('=======================================');
                    console.log('peers:');
                    fullNode.pool.peers.forEach((p) => {
                        console.log(p.addr.toString() + '\n');
                    });
                    break;
                case 'addrMan ls':
                    console.log('=======================================');
                    console.log('addrMan:');
                    fullNode.pool.addrMan.nodes.forEach((p) => {
                        console.log(p.toString() + '\n');
                    });
                    break;
                case 'mine-empty':
                    console.log('mining empty block for some bitcoin...');
                    fullNode.miner.mineCoinbaseBlock();
                    break;
                case 'wallet balance':
                    console.log('balance: ' + fullNode.wallet.balance()) + ' BTC';
                    break;
                case 'wallet addr':
                    console.log('address: ' + fullNode.wallet.userKey.publicKey);
                    break;
                case 'chain valid':
                    console.log(`chain valid: ${fullNode.chain.isChainValid()}`);
                    break;
                case 'chain ls':
                    console.log('=======================================');
                    console.log('chain blocks:');
                    fullNode.chain.blocks.forEach((b) => {
                        console.log('hash: ' + b.hash);
                        console.log('previousHash: ' + b.previousHash);
                        console.log('timestamp: ' + b.timestamp);
                        console.log('nonce: ' + b.nonce);
                        for (const tx of b.txs) {
                            console.log('---------------------------------------------');
                            console.log(tx.toString());
                        }
                        console.log('\n');
                    });
                    break;
                case 'txpool ls':
                    console.log('=======================================');
                    console.log('txpool pending:');
                    fullNode.txpool.pending.forEach((tx) => {
                        console.log(tx.toString() + '\n');
                    });
                    break;
                default:
                    console.log('unknown command');
                    break;
            }
        }
        rl.prompt();
    }).on('close', () => {
        console.log('[SYSTEM] Exiting...');
        process.exit(0);
    });
};
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    yield fullNode.open();
    yield fullNode.connect();
    setTimeout(() => {
        processComands();
    }, 3000);
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        processArguments();
        if (options.addr.toString() === '127.0.0.1:3000') {
            init();
        }
        else {
            setTimeout(() => {
                init();
            }, 1000);
        }
    }
    catch (err) {
        console.log(err);
    }
});
main();
//# sourceMappingURL=main.js.map