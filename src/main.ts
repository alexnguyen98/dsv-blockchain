import * as readline from 'readline';
import { argv, stdin as input, stdout as output } from 'process';
import { Options } from './types/Options';
import FullNode from './FullNode';
import Address from './Address';

const rl = readline.createInterface({ input, output, terminal: false });

let fullNode: FullNode;
const options: Options = {
  id: '',
  addr: null,
  nodes: [],
};

const processArguments = async () => {
  process.argv.forEach((arg) => {
    if (arg.includes('--addr=')) {
      const split = arg.replace('--addr=', '').split(':');
      const ip = split[0];
      const port = parseInt(split[1]);

      if (!port || !ip) throw new Error('Unable to parse address');

      options.addr = new Address(ip, port);
    } else if (arg.includes('--connect=')) {
      const split = arg.replace('--connect=', '').split(',');
      split?.forEach((i) => {
        const s = i.split(':');
        const ip = s[0];
        const port = parseInt(s[1]);

        if (!port || !ip) throw new Error('Unable to parse address');

        options.nodes.push(new Address(ip, port));
      });
    } else if (arg.includes('--id=')) {
      const id = arg.replace('--id=', '');

      if (!id) throw new Error('Unable to parse id');

      options.id = id;
    }
  });

  if (!options.addr || !options.id)
    throw new Error('Missing argument addr or id');

  fullNode = new FullNode(options);
};

const processComands = () => {
  rl.prompt();
  rl.on('line', (line) => {
    if (line.includes('tx') && line.includes('-to=') && line.includes('-am=')) {
      let to, am;

      line.split(' ').forEach((i) => {
        if (i.includes('-to=')) {
          to = i.split('=')[1];
        } else if (i.includes('-am=')) {
          am = parseInt(i.split('=')[1]);
        }
      });

      console.log('=======================================');
      console.log(`transaction to ${to} with the amount ${am}`);
      fullNode.wallet.send(to, am);
    } else {
      switch (line.trim()) {
        case '--help':
          console.log(
            `- 'peers ls'                        get the list of addr of connected peers`,
          );
          console.log(
            `- 'addrMan ls'                      get the list of hosts`,
          );
          console.log(
            `- 'tx -to=<addr> -am=<amount>'      send a transaction to address`,
          );
          console.log(
            `- 'mine-empty'                      mine empty block to get bitcoin`,
          );
          console.log(
            `- 'wallet balance'                  get current balance`,
          );
          console.log(
            `- 'wallet addr'                     wallet address ie public key`,
          );
          console.log(
            `- 'chain valid'                     check if chain is valid`,
          );
          console.log(
            `- 'chain ls'                        get info of all blocks in chain`,
          );
          console.log(
            `- 'txpool ls'                       get list of pending transactions`,
          );
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

const init = async () => {
  await fullNode.open();
  await fullNode.connect();

  setTimeout(() => {
    processComands();
  }, 3000);
};

const main = async () => {
  try {
    processArguments();

    if (options.addr.toString() === '127.0.0.1:3000') {
      // Init seed node sooner
      init();
    } else {
      setTimeout(() => {
        init();
      }, 1000);
    }
  } catch (err) {
    console.log(err);
  }
};

main();
