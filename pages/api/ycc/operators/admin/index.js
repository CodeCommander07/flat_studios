import dbConnect from '@/utils/db';
import OperatorSubmission from '@/models/Operators';

export default async function handler(req, res) {
  await dbConnect();

  // 🟢 Create operator
  if (req.method === 'POST') {
    try {
      const {
        email,
        robloxUsername,
        discordTag,
        operatorName,
        discordInvite,
        robloxGroup,
        description,
        logo, // now just a URL
      } = req.body;

      const submission = await OperatorSubmission.create({
        email,
        robloxUsername,
        discordTag,
        operatorName,
        discordInvite,
        robloxGroup,
        description,
        logo,
      });

      return res.status(201).json({ success: true, submission });
    } catch (err) {
      console.error('Error creating operator submission:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  // 🟡 Get all operators
  else if (req.method === 'GET') {
    try {
      const submissions = await OperatorSubmission.find();
      return res.status(200).json({ submissions });
    } catch (err) {
      console.error('Error fetching operator submissions:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // 🔴 Unsupported method
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
