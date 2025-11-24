import dbConnect from '@/utils/db';
import ContactRequest from '@/models/ContactRequest';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // ✅ GET — return all requests
    if (req.method === 'GET') {
      const requests = await ContactRequest.find().sort({ createdAt: -1 });
      return res.status(200).json({ requests });
    }

    // ✅ PATCH — mark as replied
    if (req.method === 'PATCH') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Missing request ID" });
      }

      const updated = await ContactRequest.findByIdAndUpdate(
        id,
        { status: "replied" },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Request not found" });
      }

      return res.status(200).json({
        message: "Status updated",
        request: updated
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load data' });
  }
}
