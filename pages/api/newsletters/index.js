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
  server: process.env.MAILCHIMP_API_KEY.split("-")[1], // ✅ auto detect region
});

const LIST_ID = "890f788c56"

// Helper: Mailchimp subscriber hash
const subscriberHash = (email) =>
  crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

export default async function handler(req, res) {
  try {
    // GET → fetch all members
    if (req.method === "GET") {
      let all = [];
      let offset = 0;

      while (true) {
        const response = await mailchimp.lists.getListMembersInfo(LIST_ID, {
          count: 1000,
          offset
        });

        all.push(...response.members);

        if (response.members.length < 1000) break;

        offset += 1000;
      }

      return res.status(200).json({
        success: true,
        members: all,
        total: all.length
      });
    }

    if (req.method === "PATCH") {
      const { email, username } = req.body;

      if (!email)
        return res.status(400).json({ error: "Email is required" });

      const hash = subscriberHash(email);

      try {
        // ✅ create/update subscriber in Mailchimp
        const response = await mailchimp.lists.setListMember(
          LIST_ID,
          hash,
          {
            email_address: email,
            status_if_new: "subscribed",
            merge_fields: {
              MMERGE1: username || ""   // ✅ username field
            }
          }
        );

        // ✅ send confirmation email
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
              <p style="font-size: 18px;">Hi <strong>${username}</strong>,</p>
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
          to: email,
          subject: "🥳 Newsletter subscription",
          html,
        });

        return res.status(200).json({
          success: true,
          member: response
        });

      } catch (err) {
        console.error("Mailchimp upsert error:", err.response?.body || err);
        return res.status(500).json({
          error: "Mailchimp upsert failed",
          details: err.response?.body || err.message
        });
      }
    }

    if (req.method === "DELETE") {
      const { email } = req.body;

      if (!email)
        return res.status(400).json({ error: "Email is required" });

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
              <p style="font-size: 18px;">Hi <strong>${email}</strong>,</p>
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
        to: email,
        subject: "👋 Newsletter cancelled",
        html,
      });

      const hash = subscriberHash(email);

    await mailchimp.lists.setListMember(LIST_ID, hash, {
      email_address: email,
      status: "unsubscribed"
    });

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Mailchimp API error:", err.response?.body || err);
    res.status(500).json({
      error: "Mailchimp error",
      details: err.response?.body || err.message,
    });
  }
}
