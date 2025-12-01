import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method === "GET") {
    const filter = req.query.type || "both";

    const doc = await GameData.findOne({ serverId });
    if (!doc) return res.status(200).json([]);

    if (filter === "join")
      return res.status(200).json(doc.logs.filter(l => l.type === "join"));

    if (filter === "leave")
      return res.status(200).json(doc.logs.filter(l => l.type === "leave"));

    return res.status(200).json(doc.logs);
  }

  if (req.method === "POST") {
    const body = req.body;

    let doc = await GameData.findOne({ serverId });
    if (!doc) doc = await GameData.create({ serverId });

    doc.logs.push(body);
    await doc.save();

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
