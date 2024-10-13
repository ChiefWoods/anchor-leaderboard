import { AnchorError, AnchorProvider, BN, Program, setProvider, workspace } from "@coral-xyz/anchor";
import { RockDestroyer } from "../target/types/rock_destroyer";
import { Keypair, PublicKey } from '@solana/web3.js';
import { assert } from 'chai';
import fs from 'fs';

describe("rock-destroyer", () => {
  setProvider(AnchorProvider.env());

  const program = workspace.RockDestroyer as Program<RockDestroyer>;
  const programProvider = program.provider as AnchorProvider;

  const gameOwner = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync("game-owner.json", "utf-8"))));
  const [leaderboardPublicKey] = PublicKey.findProgramAddressSync([Buffer.from("leaderboard"), gameOwner.publicKey.toBuffer()], program.programId);

  it("initializes leaderboard", async () => {
    const signature = await programProvider.connection.requestAirdrop(gameOwner.publicKey, 1_000_000_000);
    const { blockhash, lastValidBlockHeight } = await programProvider.connection.getLatestBlockhash();
    await programProvider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });

    await program.methods.initializeLeaderboard().accounts({
      leaderboard: leaderboardPublicKey,
      gameOwner: gameOwner.publicKey
    }).signers([gameOwner]).rpc();

    const leaderboardData = await program.account.leaderboard.fetch(leaderboardPublicKey);

    assert.deepEqual(leaderboardData.players, []);
  });

  it("creates a new game", async () => {
    await programProvider.connection.requestAirdrop(gameOwner.publicKey, 1_000_000_000);
    const player = Keypair.generate();
    const signature = await programProvider.connection.requestAirdrop(player.publicKey, 5_000_000_000);
    const { blockhash, lastValidBlockHeight } = await programProvider.connection.getLatestBlockhash();
    await programProvider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });

    const balanceBefore = await programProvider.connection.getBalance(player.publicKey);

    await program.methods.initializeLeaderboard().accounts({
      leaderboard: leaderboardPublicKey,
      gameOwner: gameOwner.publicKey
    }).signers([gameOwner]).rpc();

    await program.methods.newGame("camperbot").accounts({
      user: player.publicKey,
      gameOwner: gameOwner.publicKey,
      leaderboard: leaderboardPublicKey
    }).signers([player]).rpc();

    const balanceAfter = await programProvider.connection.getBalance(player.publicKey);
    const leaderboardData = await program.account.leaderboard.fetch(leaderboardPublicKey);

    assert.isAbove(leaderboardData.players.length, 0);
    assert.equal(leaderboardData.players[0].username, "camperbot");
    assert.deepEqual(leaderboardData.players[0].pubkey, player.publicKey);
    assert.equal(leaderboardData.players[0].hasPayed, true);
    assert.equal(leaderboardData.players[0].score.toNumber(), new BN(0).toNumber());
    assert.isAtLeast(balanceBefore - balanceAfter, 1_000_000_000);
  })

  it("adds a player to the leaderboard", async () => {
    await programProvider.connection.requestAirdrop(gameOwner.publicKey, 1_000_000_000);
    const player = Keypair.generate();
    const signature = await programProvider.connection.requestAirdrop(player.publicKey, 5_000_000_000);
    const { blockhash, lastValidBlockHeight } = await programProvider.connection.getLatestBlockhash();
    await programProvider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });

    await program.methods.initializeLeaderboard().accounts({
      leaderboard: leaderboardPublicKey,
      gameOwner: gameOwner.publicKey

    }).signers([gameOwner]).rpc();

    await program.methods.newGame("camperbot").accounts({
      user: player.publicKey,
      gameOwner: gameOwner.publicKey,
      leaderboard: leaderboardPublicKey
    }).signers([player]).rpc();

    await program.methods.addPlayerToLeaderboard(new BN(100)).accounts({
      leaderboard: leaderboardPublicKey,
      user: player.publicKey
    }).signers([player]).rpc();

    const leaderboardData = await program.account.leaderboard.fetch(leaderboardPublicKey);

    assert.equal(leaderboardData.players[0].score.toNumber(), new BN(100).toNumber());
    assert.equal(leaderboardData.players[0].hasPayed, false);
  })

  it("throws an error when the user does not exist", async () => {
    await programProvider.connection.requestAirdrop(gameOwner.publicKey, 1_000_000_000);
    const player = Keypair.generate();
    const signature = await programProvider.connection.requestAirdrop(player.publicKey, 5_000_000_000);
    const { blockhash, lastValidBlockHeight } = await programProvider.connection.getLatestBlockhash();
    await programProvider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });

    await program.methods.initializeLeaderboard().accounts({
      leaderboard: leaderboardPublicKey,
      gameOwner: gameOwner.publicKey
    }).signers([gameOwner]).rpc();

    try {
      await program.methods.addPlayerToLeaderboard(new BN(100)).accounts({
        leaderboard: leaderboardPublicKey,
        user: player.publicKey
      }).signers([player]).rpc();
    } catch (e) {
      assert.instanceOf(e, AnchorError);
      assert.equal(e.error.errorCode.code, "PlayerNotFound");
      assert.equal(e.error.errorCode.number, 6000);
    }
  })

  it("throws an error when the user has not payed", async () => {
    await programProvider.connection.requestAirdrop(gameOwner.publicKey, 1_000_000_000);
    const player = Keypair.generate();
    const signature = await programProvider.connection.requestAirdrop(player.publicKey, 5_000_000_000);
    const { blockhash, lastValidBlockHeight } = await programProvider.connection.getLatestBlockhash();
    await programProvider.connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    });

    await program.methods.initializeLeaderboard().accounts({
      leaderboard: leaderboardPublicKey,
      gameOwner: gameOwner.publicKey
    }).signers([gameOwner]).rpc();

    await program.methods.newGame("camperbot").accounts({
      user: player.publicKey,
      gameOwner: gameOwner.publicKey,
      leaderboard: leaderboardPublicKey
    }).signers([player]).rpc();

    await program.methods.addPlayerToLeaderboard(new BN(100)).accounts({
      leaderboard: leaderboardPublicKey,
      user: player.publicKey
    }).signers([player]).rpc();

    try {
      await program.methods.addPlayerToLeaderboard(new BN(150)).accounts({
        leaderboard: leaderboardPublicKey,
        user: player.publicKey
      }).signers([player]).rpc();
    } catch (e) {
      assert.instanceOf(e, AnchorError);
      assert.equal(e.error.errorCode.code, "PlayerHasNotPaid");
      assert.equal(e.error.errorCode.number, 6001);
    }
  })
});
