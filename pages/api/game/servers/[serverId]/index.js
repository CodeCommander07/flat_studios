import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  const { serverId } = req.query;
  await dbConnect();

  try {
    const server = await GameData.findOne({ serverId });
    if (!server)
      return res.status(404).json({ error: "Server not found" });

    // ✅ Return timestamps and useful metadata
    return res.status(200).json({
      serverId: server.serverId,
      players: server.players?.length || 0,
      chats: server.chat?.length || 0,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    });
  } catch (err) {
    console.error("Error fetching server:", err);
    return res.status(500).json({ error: err.message });
  }
}
