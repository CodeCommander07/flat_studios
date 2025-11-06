// pages/api/game/stats.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const universeId = process.env.ROBLOX_UNIVERSE_ID || "2103484249"; // your game's universe ID
  const groupId = process.env.ROBLOX_GROUP_ID || "7475597"; // your Roblox group ID

  try {
    // Game stats (visits, favorites, updated, etc.)
    const gameRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    const gameData = await gameRes.json();
    const game = gameData?.data?.[0] || {};

    // Votes (likes / dislikes)
    const votesRes = await fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`);
    const votesData = await votesRes.json();
    const votes = votesData?.data?.[0] || {};

    // Group member count
    const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
    const groupData = await groupRes.json();
    const groupMembers = groupData?.memberCount ?? 0;

    const payload = {
      name: game.name,
      universeId: game.id,
      current: game.playing,
      visits: game.visits,
      likes: votes.upVotes || 0,
      dislikes: votes.downVotes || 0,
      updated: game.updated,
      playing: game.playing,
      groupMembers,
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("[ROBLOX API ERROR]", err);
    return res.status(500).json({ error: "Failed to fetch Roblox data" });
  }
}
