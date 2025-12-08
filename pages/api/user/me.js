import dbConnect from '@/utils/db';
import User from '@/models/User';
import mailchimp from "@mailchimp/mailchimp_marketing";
import crypto from "crypto";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: "us10"
});

const LIST_ID = "890f788c56";

const subscriberHash = (email) =>
  crypto.createHash("md5").update(email.toLowerCase()).digest("md5").digest("hex");

export default async function handler(req, res) {
  const { id, status } = req.query;

  if (!id) return res.status(400).json({ message: 'Missing user ID' });

  await dbConnect();

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.method === 'GET') {
      return res.status(200).json(user);
    }

    if (req.method === "PUT") {

      if (status === "edit") {
        const { username, email, newsletter } = req.body;

        if (username) user.username = username;
        if (email) user.email = email;

        if (newsletter !== undefined) {
          const emailToUse = email || user.email;
          const hash = crypto.createHash("md5").update(emailToUse.toLowerCase()).digest("hex");

          try {
            if (newsletter) {
              await mailchimp.lists.setListMember(LIST_ID, hash, {
                email_address: emailToUse,
                status_if_new: "subscribed",
                status: "subscribed",
                merge_fields: { FNAME: username || user.username || "" }
              });
            } else {
              await mailchimp.lists.setListMember(LIST_ID, hash, {
                email_address: emailToUse,
                status: "unsubscribed"
              });
            }

            user.newsletter = newsletter;

          } catch (err) {
            console.error("Mailchimp error:", err.response?.body || err);
            return res.status(500).json({
              message: "Mailchimp error",
              details: err.response?.body || err.message,
            });
          }
        }

        await user.save();
        return res.status(200).json({ message: "User updated", user });
      }

      if (status === "avatar") {
        const { defaultAvatar } = req.body;

        if (!defaultAvatar)
          return res.status(400).json({ message: "Missing avatar URL" });

        user.defaultAvatar = defaultAvatar;
        await user.save();

        return res.status(200).json({ message: "Avatar updated", user });
      }

      if (status === "disconnectDiscord") {
        const wasDefault = user.defaultAvatar === user.discordAvatar;

        user.discordId = null;
        user.discordUsername = null;
        user.discordAvatar = null;

        // Auto fallback avatar
        if (wasDefault) {
          user.defaultAvatar = "/black_logo.png";
        }

        await user.save();
        return res.status(200).json({ message: "Discord disconnected", user });
      }

      if (status === "disconnectRoblox") {
        const wasDefault = user.defaultAvatar === user.robloxAvatar;

        user.robloxId = null;
        user.robloxUsername = null;
        user.robloxAvatar = null;

        // Auto fallback avatar
        if (wasDefault) {
          user.defaultAvatar = "/black_logo.png";
        }

        await user.save();
        return res.status(200).json({ message: "Roblox disconnected", user });
      }

      return res.status(400).json({ message: "Invalid status parameter" });
    }

    return res.status(405).json({ message: "Method Not Allowed" });

  } catch (err) {
    console.error("User API error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
