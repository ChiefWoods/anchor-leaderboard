use anchor_lang::{prelude::*, pubkey, system_program};

declare_id!("CqmE9A5DYWUdys2Zi3bPEUCL2rYs8tjHdxzZkWy8WzGN");

const GAME_OWNER_PUBKEY: Pubkey = pubkey!("9agDtgAxwyEhGDFMEdAJiyHUiKehjCpeLWbEj7ZoDhP");

#[program]
pub mod rock_destroyer {
    use super::*;

    pub fn initialize_leaderboard(ctx: Context<InitializeLeaderboard>) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;

        leaderboard.initialize()
    }

    pub fn new_game(ctx: Context<NewGame>, username: String) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.game_owner.to_account_info(),
                },
            ),
            1000000000,
        )?;

        let new_player = Player {
            username,
            pubkey: ctx.accounts.user.key(),
            score: 0,
            has_payed: true,
        };

        leaderboard.add_player(new_player)
    }

    pub fn add_player_to_leaderboard(ctx: Context<AddPlayerToLeaderboard>, score: u64) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;

        leaderboard.update_score(&ctx.accounts.user.key(), score)
    }
}

#[derive(Accounts)]
pub struct InitializeLeaderboard<'info> {
    #[account(
        init_if_needed,
        payer = game_owner,
        space = 8 + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard", game_owner.key().as_ref()],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
    #[account(
        mut,
        address = GAME_OWNER_PUBKEY,
        owner = system_program.key()
    )]
    pub game_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NewGame<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        mut,
        address = GAME_OWNER_PUBKEY,
        owner = system_program.key()
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    game_owner: UncheckedAccount<'info>,
    #[account(mut)]
    leaderboard: Account<'info, Leaderboard>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddPlayerToLeaderboard<'info> {
    #[account(mut)]
    leaderboard: Account<'info, Leaderboard>,
    user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Leaderboard {
    #[max_len(5)]
    players: Vec<Player>,
}

impl Leaderboard {
    pub fn initialize(&mut self) -> Result<()> {
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

#[account]
#[derive(InitSpace)]
pub struct Player {
    #[max_len(32)]
    username: String,
    pubkey: Pubkey,
    score: u64,
    has_payed: bool,
}

#[error_code]
pub enum RockDestroyerError {
    PlayerNotFound,
    PlayerHasNotPaid,
}
