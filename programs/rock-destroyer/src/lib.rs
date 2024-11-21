use anchor_lang::{
    prelude::*,
    pubkey,
    system_program::{transfer, Transfer},
    Discriminator,
};

declare_id!("RoCK6dTHRi3EvCQx4zJRRBDKNy2FDeqcj1m4sb7sn7a");

const GAME_OWNER_PUBKEY: Pubkey = pubkey!("RoCK2yYsK2nq4GWpCvpzzmyNXE9Z7sEKkJRGbaUuDVT");

#[program]
pub mod rock_destroyer {
    use super::*;

    pub fn initialize_leaderboard(ctx: Context<InitializeLeaderboard>) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;

        leaderboard.initialize(ctx.bumps.leaderboard)
    }

    pub fn new_game(ctx: Context<NewGame>, username: String) -> Result<()> {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.game_owner.to_account_info(),
                },
            ),
            1000000000,
        )?;

        let leaderboard = &mut ctx.accounts.leaderboard;

        leaderboard.add_player(Player {
            username,
            pubkey: ctx.accounts.user.key(),
            score: 0,
            has_payed: true,
        })
    }

    pub fn add_player_to_leaderboard(
        ctx: Context<AddPlayerToLeaderboard>,
        score: u64,
    ) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;

        leaderboard.update_score(&ctx.accounts.user.key(), score)
    }
}

#[derive(Accounts)]
pub struct InitializeLeaderboard<'info> {
    #[account(
        mut,
        address = GAME_OWNER_PUBKEY,
        owner = system_program.key()
    )]
    pub game_owner: Signer<'info>,
    #[account(
        init_if_needed,
        payer = game_owner,
        space = Leaderboard::DISCRIMINATOR.len() + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard", game_owner.key().as_ref()],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NewGame<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        address = GAME_OWNER_PUBKEY,
        owner = system_program.key()
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub game_owner: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"leaderboard", game_owner.key().as_ref()],
        bump = leaderboard.bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddPlayerToLeaderboard<'info> {
    pub user: Signer<'info>,
    #[account(
        address = GAME_OWNER_PUBKEY,
        owner = system_program.key()
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub game_owner: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"leaderboard", game_owner.key().as_ref()],
        bump = leaderboard.bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Leaderboard {
    pub bump: u8,
    #[max_len(5)]
    pub players: Vec<Player>,
}

impl Leaderboard {
    pub fn initialize(&mut self, bump: u8) -> Result<()> {
        self.bump = bump;
        self.players = Vec::new();
        Ok(())
    }

    pub fn add_player(&mut self, player: Player) -> Result<()> {
        if self.players.len() < 5 {
            self.players.push(player);
        } else {
            let min_index = self
                .players
                .iter()
                .enumerate()
                .min_by_key(|&(_, p)| p.score)
                .map(|(i, _)| i)
                .unwrap();

            self.players[min_index] = player;
        }

        Ok(())
    }

    pub fn update_score(&mut self, pubkey: &Pubkey, score: u64) -> Result<()> {
        let player = self
            .players
            .iter_mut()
            .find(|p| p.pubkey == *pubkey)
            .ok_or(RockDestroyerError::PlayerNotFound)?;

        require_eq!(player.has_payed, true, RockDestroyerError::PlayerHasNotPaid);

        player.score = score;
        player.has_payed = false;

        Ok(())
    }
}

#[derive(InitSpace, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Player {
    pub has_payed: bool,
    pub score: u64,
    pub pubkey: Pubkey,
    #[max_len(32)]
    pub username: String,
}

#[error_code]
pub enum RockDestroyerError {
    #[msg("Player not found")]
    PlayerNotFound,
    #[msg("Player has not paid")]
    PlayerHasNotPaid,
}
