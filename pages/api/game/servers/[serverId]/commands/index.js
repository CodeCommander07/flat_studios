import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method === "GET") {
    const doc = await GameData.findOne({ serverId });
    if (!doc) return res.status(200).json([]);

    const pending = doc.commands.filter(c => !c.executed);
    return res.status(200).json(pending);
  }

  if (req.method === "POST") {
    const body = req.body;

    let doc = await GameData.findOne({ serverId });
    if (!doc) doc = await GameData.create({ serverId });

    doc.commands.push({
      type: body.type,
      targetId: body.targetId,
      reason: body.reason,
      issuedBy: body.issuedBy,
      executed: false,
      createdAt: new Date(),
    });

    await doc.save();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
