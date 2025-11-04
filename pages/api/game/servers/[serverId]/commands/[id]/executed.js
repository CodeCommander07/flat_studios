import dbConnect from "@/utils/db";
import GameCommand from "@/models/GameCommand";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "POST") {
    try {
      const command = await GameCommand.findByIdAndUpdate(id, { executed: true });
      if (!command) return res.status(404).json({ error: "Command not found" });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Mark Executed Error]", err);
      return res.status(500).json({ error: "Failed to update command" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
