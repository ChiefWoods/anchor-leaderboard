import { beforeAll, describe, expect, test } from "bun:test";
import { AnchorError, AnchorProvider, BN, Program, setProvider, workspace } from "@coral-xyz/anchor";
import { RockDestroyer } from "../target/types/rock_destroyer";
import { Keypair, PublicKey } from '@solana/web3.js';

describe("rock-destroyer", () => {
  setProvider(AnchorProvider.env());

  const program = workspace.RockDestroyer as Program<RockDestroyer>;
  const connection = program.provider.connection;

  let gameOwner: Keypair;
  let leaderboardPda: PublicKey;
  let leaderboardBump: number;

  beforeAll(async () => {
    gameOwner = Keypair.fromSecretKey(new Uint8Array(await Bun.file("game-owner.json").json()));

    [leaderboardPda, leaderboardBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("leaderboard"),
        gameOwner.publicKey.toBuffer()
      ],
      program.programId
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(gameOwner.publicKey, 5_000_000_000)
    });
  })

  test("initializes leaderboard", async () => {
    await program.methods
      .initializeLeaderboard()
      .accounts({
        leaderboard: leaderboardPda,
        gameOwner: gameOwner.publicKey
      })
      .signers([gameOwner])
      .rpc();

    const leaderboardAcc = await program.account.leaderboard.fetch(leaderboardPda);

    expect(leaderboardAcc.bump).toEqual(leaderboardBump);
    expect(leaderboardAcc.players).toEqual([]);
  });

  test("creates a new game", async () => {
    const player = Keypair.generate();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(player.publicKey, 5_000_000_000)
    });

    const balanceBefore = await connection.getBalance(player.publicKey);

    await program.methods
      .initializeLeaderboard()
      .accounts({
        leaderboard: leaderboardPda,
        gameOwner: gameOwner.publicKey
      })
      .signers([gameOwner])
      .rpc();

    const username = "camperbot";

    await program.methods
      .newGame(username)
      .accounts({
        user: player.publicKey,
      })
      .signers([player])
      .rpc();

    const leaderboardAcc = await program.account.leaderboard.fetch(leaderboardPda);
    const balanceAfter = await connection.getBalance(player.publicKey);

    expect(leaderboardAcc.players.length).toEqual(1);
    expect(leaderboardAcc.players[0].hasPayed).toEqual(true);
    expect(leaderboardAcc.players[0].score.toNumber()).toEqual(0);
    expect(leaderboardAcc.players[0].pubkey).toEqual(player.publicKey);
    expect(leaderboardAcc.players[0].username).toEqual(username);
    expect(balanceBefore - balanceAfter).toBeGreaterThanOrEqual(1_000_000_000);
  })

  test("adds a player to the leaderboard", async () => {
    const player = Keypair.generate();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(player.publicKey, 5_000_000_000)
    });

    await program.methods
      .initializeLeaderboard()
      .accounts({
        leaderboard: leaderboardPda,
        gameOwner: gameOwner.publicKey

      })
      .signers([gameOwner])
      .rpc();

    await program.methods
      .newGame("camperbot")
      .accounts({
        user: player.publicKey,
      })
      .signers([player])
      .rpc();

    const score = 100;

    await program.methods
      .addPlayerToLeaderboard(new BN(score))
      .accounts({
        user: player.publicKey
      })
      .signers([player])
      .rpc();

    const leaderboardAcc = await program.account.leaderboard.fetch(leaderboardPda);

    expect(leaderboardAcc.players[0].score.toNumber()).toEqual(score);
    expect(leaderboardAcc.players[0].hasPayed).toEqual(false);
  })

  test("throws an error when the user does not exist", async () => {
    const player = Keypair.generate();

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(player.publicKey, 5_000_000_000)
    });

    await program.methods
      .initializeLeaderboard()
      .accounts({
        leaderboard: leaderboardPda,
        gameOwner: gameOwner.publicKey
      })
      .signers([gameOwner])
      .rpc();

    try {
      await program.methods
        .addPlayerToLeaderboard(new BN(100))
        .accounts({
          user: player.publicKey
        })
        .signers([player])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("PlayerNotFound");
      expect(err.error.errorCode.number).toEqual(6000);
    }
  })

  test("throws an error when the user has not payed", async () => {
    const player = Keypair.generate();

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(player.publicKey, 5_000_000_000)
    });

    await program.methods
      .initializeLeaderboard()
      .accounts({
        leaderboard: leaderboardPda,
        gameOwner: gameOwner.publicKey
      })
      .signers([gameOwner])
      .rpc();

    await program.methods
      .newGame("camperbot")
      .accounts({
        user: player.publicKey,
      })
      .signers([player])
      .rpc();

    await program.methods
      .addPlayerToLeaderboard(new BN(100))
      .accounts({
        user: player.publicKey
      })
      .signers([player])
      .rpc();

    try {
      await program.methods
        .addPlayerToLeaderboard(new BN(150))
        .accounts({
          user: player.publicKey
        })
        .signers([player])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("PlayerHasNotPaid");
      expect(err.error.errorCode.number).toEqual(6001);
    }
  })
});
