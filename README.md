# DSV Blockchain

A small version of the bitcoin protocol for the subject DSV, university CVUT

## Prerequisite

- Theme: Blockchain
- Connection: Websockets
- Algorithm: Proof of work and Consensus

## Getting Started

### Requirements

- Node
- yarn/npm

### Usage

```bash
# install dependencies
yarn install

# running dev mode with hot-reload with debug logs
yarn dev --addr=<ip:port> --id=<name>
# optional to add --connect=<ip1:port1>, <ip2:port2> to specify who to connect to

# production build
yarn build

# running production without debug logs
yarn start --addr=<ip:port> --id=<name>
# optional to add --connect=<ip1:port1>, <ip2:port2> to specify who to connect to
```

### Commands after running the project

```bash
# get all commands
--help

# get the list of addr of connected peers
peers ls

# get the list of hosts
addrMan ls

# send a transaction to address
tx -to=<addr> -am=<amount>

# mine empty block to get bitcoin
mine-empty

# get current balance
wallet balance

# wallet address ie public key
wallet addr

# check if chain is valid
chain valid

# get info of all blocks in chain
chain ls

# get list of pending transactions
txpool ls
```

## Architecture and implementation

You can find this info in the `/docs` folder
