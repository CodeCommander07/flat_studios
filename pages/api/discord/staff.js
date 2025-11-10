// pages/api/server.js
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let loggedIn = false;

// ✅ Only login once
async function ensureBotLoggedIn() {
  if (!loggedIn) {
    try {
      await client.login(process.env.BOT_TOKEN);
      console.log("✅ Discord bot logged in");
      loggedIn = true;
    } catch (err) {
      console.error("❌ Discord login failed:", err);
    }
  }
}

export default async function handler(req, res) {
  await ensureBotLoggedIn();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const serverId = "733620693392162866"; // Replace with your guild ID

    const staffRoles = [
      "Owner",
      "Director of Human Resources",
      "Senior Developer",
      "Developer",
      "Community Director",
      "Administrator",
      "Operators",
      "Operations Manager",
    ];

    // Fetch guild + members
    const guild = await client.guilds.fetch(serverId);
    const members = await guild.members.fetch();

    const staff = members
      .filter(
        (member) =>
          member.user.username !== client.user.username &&
          member.roles.cache.some((role) => staffRoles.includes(role.name))
      )
      .map((member) => ({
        username: member.user.username,
        avatar: member.user.displayAvatarURL({ size: 512, dynamic: true }),
        highestRole: member.roles.highest.name,
      }))
      .sort((a, b) => {
        const aIndex = staffRoles.indexOf(a.highestRole);
        const bIndex = staffRoles.indexOf(b.highestRole);
        return aIndex - bIndex;
      });

    return res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching Discord data:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch Discord server data" });
  }
}
