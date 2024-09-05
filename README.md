# Anchor Leaderboard

On-chain leaderboard for Solana Curriculum in [freeCodeCampWeb3](https://web3.freecodecamp.org/).

[Program on Solana Explorer](https://explorer.solana.com/address/CqmE9A5DYWUdys2Zi3bPEUCL2rYs8tjHdxzZkWy8WzGN?cluster=devnet)

[Source Repository](https://github.com/ChiefWoods/anchor-leaderboard)

## Built With

### Languages

- [![Rust](https://img.shields.io/badge/Rust-f75008?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-ffffff?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

### Crates

- [anchor-lang](https://docs.rs/anchor-lang/0.30.1/anchor_lang/index.html)

### Test Frameworks

- [![Mocha](https://img.shields.io/badge/Mocha-ffffff?style=for-the-badge&logo=mocha)](https://mochajs.org/)

### Tools

- [![!Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-2c2c32?style=for-the-badge&logo=visual-studio-code&logoColor=007ACC)](https://code.visualstudio.com/)

## Getting Started

### Prerequisites

1. Update your Solana CLI, npm package and avm to the latest version

```
solana-install update
npm install npm@latest -g
avm update
```

### Setup

1. Clone the repository

```
git clone https://github.com/ChiefWoods/anchor-leaderboard.git
```

2. Install all dependencies

```
npm install
```

3. Generate a new keypair

```
solana-keygen-new -o game-owner.json
```

4. Set configuration to use localhost and keypair

```
solana config set -u l -k game-owner.json
```

5. Airdrop some SOL to account

```
solana airdrop 5
```

6. Subtitute keypair's address it in `lib.rs`

```
const GAME_OWNER_PUBKEY: Pubkey = pubkey!("<KEYPAIR ADDRESS HERE>");
```

7. In the upper `rock-destroyer`, build the program

```
anchor build
```

8. Test the program

```
anchor test
```

9. Deploy the program to localnet

```
anchor deploy
```

## Issues

View the [open issues](https://github.com/ChiefWoods/anchor-leaderboard/issues) for a full list of proposed features and known bugs.

## Acknowledgements

### Resources

- [Shields.io](https://shields.io/)

## Contact

[chii.yuen@hotmail.com](mailto:chii.yuen@hotmail.com)