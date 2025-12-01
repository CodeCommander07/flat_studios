import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { commandId } = req.body;

  const doc = await GameData.findOne({ serverId });
  if (!doc) return res.status(200).json({ success: false });

  const cmd = doc.commands.id(commandId);

  if (cmd) {
    cmd.executed = true;
    await doc.save();
  }

  return res.status(200).json({ success: true });
}
