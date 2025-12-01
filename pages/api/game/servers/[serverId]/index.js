import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();
  const { serverId } = req.query;

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const doc = await GameData.findOne({ serverId });
  return res.status(200).json(doc || null);
}
