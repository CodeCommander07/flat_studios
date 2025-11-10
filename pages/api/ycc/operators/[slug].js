import dbConnect from "@/utils/db";
import Operator from "@/models/Operators";

export default async function handler(req, res) {
  await dbConnect();
  const { slug } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const operator = await Operator.findOne({ slug }).lean();
    if (!operator) {
      return res.status(404).json({ error: "Operator not found" });
    }

    // 🧩 Extract numeric group ID from saved Roblox URL or plain number
    let groupId = null;
    if (operator.robloxGroup) {
      const match = operator.robloxGroup.match(/groups\/(\d+)|(\d+)/);
      groupId = match ? match[1] || match[2] : null;
    }

    let robloxGroupData = null;

    if (groupId) {
      try {
        const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
        if (groupRes.ok) {
          robloxGroupData = await groupRes.json();
        } else {
          console.warn(`Failed to fetch Roblox group ${groupId}: ${groupRes.status}`);
        }
      } catch (err) {
        console.error("Error fetching Roblox group:", err);
      }
    } else {
      console.warn("No valid Roblox group ID found in operator.robloxGroup");
    }

    return res.status(200).json({
      operator,
      robloxGroup: robloxGroupData,
      groupId: groupId || null, // include extracted ID for debugging
    });
  } catch (err) {
    console.error("Operator API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
