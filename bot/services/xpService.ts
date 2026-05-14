type AddXpParams = {
  discordId: string;
  username: string;
  amount: number;
  reason: string;
};

export async function addXp({
  discordId,
  username,
  amount,
  reason,
}: AddXpParams) {
  console.log("XP placeholder:", {
    discordId,
    username,
    amount,
    reason,
  });

  /*
    Future database logic:

    1. Find user by discordId
    2. If user does not exist, create user
    3. Add XP amount
    4. Calculate new level
    5. Save XpLog
    6. Website reads leaderboard from database
  */
}