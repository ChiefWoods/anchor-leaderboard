# Anchor Leaderboard

On-chain leaderboard for Solana Curriculum in [freeCodeCampWeb3](https://web3.freecodecamp.org/).

[Program on Solana Explorer](https://explorer.solana.com/address/RoCK6dTHRi3EvCQx4zJRRBDKNy2FDeqcj1m4sb7sn7a?cluster=devnet)

[Source Repository](https://github.com/ChiefWoods/anchor-leaderboard)

## Built With

### Languages

- [![Rust](https://img.shields.io/badge/Rust-f75008?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-ffffff?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

### Crates

- [anchor-lang](https://docs.rs/anchor-lang/0.30.1/anchor_lang/index.html)

### Test Frameworks

- [![Bun](https://img.shields.io/badge/Bun-000?style=for-the-badge&logo=bun)](https://bun.sh/)

### Tools

- [![!Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-2c2c32?style=for-the-badge&logo=visual-studio-code&logoColor=007ACC)](https://code.visualstudio.com/)

## Getting Started

### Prerequisites

1. Update your Solana CLI, Bun package manager and avm to the latest version

```
solana-install update
bun upgrade
avm update
```

### Setup

1. Clone the repository

```
git clone https://github.com/ChiefWoods/anchor-leaderboard.git
```

2. Install all dependencies

```
bun install
```

3. Generate a new keypair

```
solana-keygen-new -o game-owner.json
```

4. Set configuration to use devnet and keypair

```
solana config set -u d -k game-owner.json
```

5. Airdrop some SOL to account

```
solana airdrop 5
```

6. Subtitute game owner address in `lib.rs`

```
const GAME_OWNER_PUBKEY: Pubkey = pubkey!("<GAME_OWNER_ADDRESS>");
```

7. In the upper `rock-destroyer`, build the program

```
anchor build
```

8. Test the program

```
anchor test
```

9. Deploy the program to devnet

```
anchor deploy --provider.cluster devnet
```

## Issues

View the [open issues](https://github.com/ChiefWoods/anchor-leaderboard/issues) for a full list of proposed features and known bugs.

## Acknowledgements

### Resources

- [Shields.io](https://shields.io/)

## Contact

[chii.yuen@hotmail.com](mailto:chii.yuen@hotmail.com)