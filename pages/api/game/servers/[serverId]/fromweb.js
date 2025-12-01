import GameData from "@/models/GameData";
import dbConnect from "@/utils/db";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

const doc = await GameData.findOne({ serverId });
  if (!doc) return NextResponse.json([]);

  const messages = doc.messagesForGame || [];

  // Optional: clear queue after sending
  doc.messagesForGame = [];
  await doc.save();

  return res.status(200).json(messages);
}
