import fetch from 'node-fetch';

// 🔗 Map operators to webhooks
const webhookMap = {
  "Yapton Country Bus": "https://discord.com/api/webhooks/1318499817047064618/FraJBKqGqPozV3gzSVnUA6SVn5JV-kNgn_NE_N6izOAIXzHIwr6QM0l4TZ_ofF3gUcQQ",
  "South West Buses / Slowcoach": "https://discord.com/api/webhooks/1317597713721987072/bFaH5g-g6_MJMnQTJnn22_B5Zrc426geKbJMf3QogZhfkT3lnb81fysMe7gFfPbJ507Z",
  "IRVING Coaches": "https://discord.com/api/webhooks/1317597749172244540/7ZsXIFpZfvCtcOPw59df-DPRUeLlhCNtLtwsmQ4FllC_54faCPKnI0tg4lQ8GyytPZfM",
  "Game": "https://discord.com/api/webhooks/1321852498985746553/2a4fCB6p_UoGHkDKNTUiO1h8UvqxrmorQt6nOmW2nGWiW4--62DRk7PJf46-ArX4a5YG",
};

function generateRandomString(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      robloxUsername,
      purpose,
      operator,
      bugDescription,
      bugReplication,
      bugEvidence,
      suggestion,
      suggestionEvidence,
    } = req.body;

    const author = `Website - ${robloxUsername || 'Unknown User'}`;
    const colour = 0xffcc4d;
    const selectedWebhook = webhookMap[operator || 'Game'];

    if (!selectedWebhook)
      return res.status(400).json({ error: 'Invalid operator or webhook missing' });

    // 🎟️ Build embed fields
    let title = '';
    let id = '';
    let description = '';
    const fields = [];

    if (purpose === 'bug') {
      title = 'Bug Report';
      id = `BUG-${generateRandomString()}`;
      description = bugDescription || 'No description provided.';
      fields.push(
        { name: 'Report ID:', value: id, inline: false },
        { name: 'Status', value: 'Pending', inline: false },
        { name: 'Replication Steps', value: bugReplication || 'N/A', inline: false },
        { name: 'Evidence Link', value: bugEvidence || 'N/A', inline: false }
      );
    } else if (purpose === 'suggestion') {
      title = 'Suggestion Verification';
      id = `SUS-${generateRandomString()}`;
      description = suggestion || 'No suggestion provided.';
      fields.push(
        { name: 'Suggestion ID:', value: id, inline: false },
        { name: 'Status', value: 'Pending', inline: false },
        { name: 'Evidence Link', value: suggestionEvidence || 'N/A', inline: false }
      );
    } else {
      return res.status(400).json({ error: 'Invalid purpose' });
    }

    // 📨 Discord payload
    const payload = {
      embeds: [
        {
          title,
          author: { name: author },
          fields,
          color: colour,
          description,
          footer: { text: 'This report has been sent from the Yapton & District website.' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // For “Game” reports, include Accept / Deny buttons
    if (operator === 'Game') {
      payload.components = [
        {
          type: 1,
          components: [
            { type: 2, label: 'Accept', style: 3, custom_id: `${id}-Accept` },
            { type: 2, label: 'Deny', style: 4, custom_id: `${id}-Deny` },
          ],
        },
      ];
    }

    // 🚀 Send to Discord
    const response = await fetch(selectedWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(`Discord webhook failed: ${response.statusText}`);

    return res.status(200).json({ success: true, id });
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: 'Failed to send report', details: err.message });
  }
}
