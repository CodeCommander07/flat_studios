import GameData from "@/models/GameData";
import dbConnect from "@/utils/db";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, author } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message required" });
  }

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  doc.chat.push({
    playerId: "WEB",
    username: author || "Dashboard",
    chatMessage: message,
    type: "notification",
    time: new Date(),
  });

  await doc.save();

  return res.status(200).json({ success: true });
}
