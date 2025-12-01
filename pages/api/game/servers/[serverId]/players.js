import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method === "GET") {
    const doc = await GameData.findOne({ serverId });
    return res.status(200).json(doc?.players || []);
  }

  if (req.method === "POST") {
    const body = req.body;

    let doc = await GameData.findOne({ serverId });
    if (!doc) doc = await GameData.create({ serverId });

    doc.players = body;
    await doc.save();

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
