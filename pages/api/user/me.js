import dbConnect from '@/utils/db';
import User from '@/models/User';
import mailchimp from "@mailchimp/mailchimp_marketing";
import crypto from "crypto";
import nodemailer from 'nodemailer';

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
});

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
              const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
        <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 20px; background-color: #283335; color: #ffffff;">
              <h1 style="font-size: 22px; margin: 0;">Newsletter Subscription</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 18px;">Hi <strong>${user.username}</strong>,</p>
              <p>You have successfully subscribed to our newsletter service.</p>
              <p>You can unsubscribe at any time:</p>
              <a href="https://yapton.flatstudios.net/me?unsubscribe">https://yapton.flatstudios.net/me?unsubscribe</a>
              <p style="margin-top: 20px;">
                Date: ${new Date().toLocaleDateString("en-UK")}
              </p>
            </td>
          </tr><tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Yapton & District Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
        </table>
      </body>
    </html>`;

              await mailHub.sendMail({
                from: '"Flat Studios" <notification@flatstudios.net>',
                to: emailToUse,
                subject: "🥳 Newsletter subscription",
                html,
              });
            } else {
              await mailchimp.lists.setListMember(LIST_ID, hash, {
                email_address: emailToUse,
                status: "unsubscribed"
              });
              const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
        <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 20px; background-color: #283335; color: #ffffff;">
              <h1 style="font-size: 22px; margin: 0;">Newsletter Subscription</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 18px;">Hi <strong>${emailToUse}</strong>,</p>
              <p>You have successfully unsubscribed to our newsletter service. We are sad to see you go.</p>
              <p>You can subscribe at any time:</p>
              <a href="https://yapton.flatstudios.net/me?subscribe">https://yapton.flatstudios.net/me?subscribe</a>
              <p style="margin-top: 20px;">
                Date: ${new Date().toLocaleDateString("en-UK")}
              </p>
            </td>
          </tr><tr>
        <td align="center" style="padding: 20px; background-color: #f4f4f9;">
          <p style="font-size: 14px;">Regards,<br><strong>Yapton & District Admin Team</strong></p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px; background-color: #f4f4f9;">
          <p style="font-size: 12px; color: #888;">This is an automated email. Yapton & District is a subsidiary of Flat Studios.</p>
        </td>
      </tr>
        </table>
      </body>
    </html>`;

              await mailHub.sendMail({
                from: '"Flat Studios" <notification@flatstudios.net>',
                to: emailToUse,
                subject: "👋 Newsletter cancelled",
                html,
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
