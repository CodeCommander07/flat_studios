import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { flagged } = req.body;

  let doc = await GameData.findOne({ serverId });
  if (!doc) doc = await GameData.create({ serverId });

  doc.flagged = flagged;
  await doc.save();

  return res.status(200).json({ success: true });
}
