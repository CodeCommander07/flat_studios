import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { playerId, username, team } = req.body;

  if (!playerId || !team)
    return res.status(400).json({ error: "playerId and team required" });

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  // find player
  let player = doc.players.find(p => p.playerId == playerId);

  if (!player) {
    // player does not exist yet — create a minimal entry
    doc.players.push({
      playerId,
      username: username || "Unknown",
      team
    });
  } else {
    // player exists — just update the team
    player.team = team;
  }

  await doc.save();
  return res.status(200).json({ success: true });
}
