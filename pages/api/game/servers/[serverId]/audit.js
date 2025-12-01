import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method === "GET") {
    const doc = await GameData.findOne({ serverId });
    if (!doc) return res.status(200).json([]);

    const sorted = [...doc.audit].sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json(sorted);
  }

  if (req.method === "POST") {
    const body = req.body;

    let doc = await GameData.findOne({ serverId });
    if (!doc) doc = await GameData.create({ serverId });

    doc.audit.push({
      action: body.action,
      targetId: body.targetId,
      targetName: body.targetName,
      moderatorId: body.moderatorId,
      moderatorName: body.moderatorName,
      reason: body.reason,
      scope: body.scope,
      banType: body.banType,
      createdAt: new Date(),
    });

    await doc.save();
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
