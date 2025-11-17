import mailchimp from "@mailchimp/mailchimp_marketing";
import crypto from "crypto";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: "us10"
});

const LIST_ID = "890f788c56"

// Helper: Mailchimp subscriber hash
const subscriberHash = (email) =>
  crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

export default async function handler(req, res) {
  try {
    // GET → fetch all members
    if (req.method === "GET") {
      const response = await mailchimp.lists.getListMembersInfo(LIST_ID);
      return res.status(200).json({ success: true, members: response.members });
    }

    // PATCH → update member
    if (req.method === "PATCH") {
      const { email, data } = req.body;

      if (!email)
        return res.status(400).json({ error: "Email is required" });

      const hash = subscriberHash(email);

      const response = await mailchimp.lists.updateListMember(
        LIST_ID,
        hash,
        data || {}
      );

      return res.status(200).json({ success: true, updated: response });
    }

    // DELETE → permanently remove a member
    if (req.method === "DELETE") {
      const { email } = req.body;

      if (!email)
        return res.status(400).json({ error: "Email is required" });

      const hash = subscriberHash(email);

      const response = await mailchimp.lists.deleteListMemberPermanent(
        LIST_ID,
        hash
      );

      return res.status(200).json({ success: true, deleted: true });
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
