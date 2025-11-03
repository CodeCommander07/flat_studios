import axios from "axios";
import dbConnect from "@/utils/db";
import GameData from "@/models/GameData";

export default async function handler(req, res) {
  await dbConnect();

  const { serverId } = req.query;

  if (req.method === "POST") {
    const { type, targetId, reason, issuedBy, issuedById, issuedByRole } = req.body;

    try {
      // Save the command
      const command = await GameData.create({
        serverId,
        type,
        targetId,
        reason,
        issuedBy,
        executed: false,
      });

      // Fetch Roblox avatar + username (optional for dashboard logs)
      let avatarUrl = "";
      try {
        const userRes = await axios.get(`https://users.roblox.com/v1/users/${issuedById}`);
        const avatarRes = await axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${issuedById}&size=150x150&format=Png&isCircular=false`
        );
        avatarUrl = avatarRes.data.data?.[0]?.imageUrl || "";
      } catch {
        avatarUrl = "https://yapton.vercel.app/cdn/image/black_logo.png";
      }

      // Add a system log in chat
      await GameData.updateOne(
        { serverId },
        {
          $push: {
            chat: {
              playerId: issuedById || "0",
              username: issuedBy || "System",
              role: issuedByRole || "Automation",
              chatMessage: `→ ${type.charAt(0).toUpperCase() + type.slice(1)} → ${reason}`,
              icon: avatarUrl,
              time: new Date(),
              isModerationLog: true,
            },
          },
        },
        { upsert: true }
      );

      return res.status(200).json({ success: true, command });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save command" });
    }
  }

  if (req.method === "GET") {
    const commands = await GameData.find({ serverId });
    return res.status(200).json(commands);
  }
}
