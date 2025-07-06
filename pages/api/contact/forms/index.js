import dbConnect from '@/utils/db';
import ContactRequest from '@/models/ContactRequest';


export default async function handler(req, res) {
  await dbConnect();

  try {

      const requests = await ContactRequest.find().sort({ createdAt: -1 });
      return res.status(200).json({ requests });

  

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load data' });
  }
}
