import GameData from "@/models/GameData";
import dbConnect from "@/utils/db";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const doc = await GameData.findOne({ serverId });
  if (!doc) return res.status(200).json([]);

  const notifications = doc.chat.filter((m) => m.type === "notification");

  // Remove notifications after sending to Roblox
  doc.chat = doc.chat.filter((m) => m.type !== "notification");
  await doc.save();

  return res.status(200).json(notifications);
}
