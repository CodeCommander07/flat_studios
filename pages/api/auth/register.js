import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import fetch from "node-fetch";
import mailchimp from "@mailchimp/mailchimp_marketing";

const mailHub = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: true,
})

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: "us10", // e.g. "us10"
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, username, role, password, newsletter } = req.body;
  await dbConnect();

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);

  const id = new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 15);

  const existingUsername = await User.findOne({ username: username });
  if (existingUsername) return res.status(409).json({ message: 'Username already taken' });

  await User.create({
    id,
    email,
    username,
    role: role || 'User',
    password: hashed,
    defaultAvatar: 'https://yapton.vercel.app/cdn/image/logo.png',
  });

  const html = `
  <!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; color: #333;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin: 20px auto; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr>
        <td style="padding: 20px; background-color: #283335; color: #ffffff;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="vertical-align: middle; width: 50px;">
                <img src="https://yapton.vercel.app/cdn/image/logo.png" alt="Yapton & District Logo" style="max-width: 50px; height: auto; margin-right: 10px;">
              </td>
              <td align="center" style="vertical-align: middle;">
                <h1 style="font-size: 24px; margin: 0; color: #ffffff;">Account Creation</h1>
              </td>
              <td style="width: 50px;"></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <p style="font-size: 18px;">Hi <strong>${username}</strong>,</p>
          <table cellpadding="6" cellspacing="0" width="100%" style="font-size: 16px; line-height: 1.6;">
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Role:</strong></td><td>${role}</td></tr>
          <tr><td><strong>Newsletter:</strong></td><td>${newsletter ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Manage Account</strong></td><td><a href="https://yapton.vercel.app/me">https://yapton.vercel.app/me</a></td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toLocaleDateString('en-UK')}</td></tr>
          </table>
        </td>
      </tr>
      <tr>
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
</html>`

  const mailOptions = {
    from: '"Flat Studios" <notification@flatstudios.net>',
    to: email,
    subject: "Account Creation",
    html,
  };
  await mailHub.sendMail(mailOptions);
  const user = await User.findOne({ id })
  const { password: _, ...safeUser } = user.toObject();

  if (newsletter === true) {
  try {
    const response = await mailchimp.lists.addListMember(
      "890f788c56", // Your list ID
      {
        email_address: email,
        status: "pending", // pending = double opt-in recommended
        merge_fields: {
          FNAME: username || "",
        },
      }
    );

    console.log("Mailchimp added:", response.id);
  } catch (err) {
    console.error("Mailchimp error:", err.response?.body || err.message);
  }
}

  res.status(200).json({ success: true, safeUser });
}
