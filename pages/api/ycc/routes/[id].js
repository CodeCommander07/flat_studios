import dbConnect from '@/utils/db';
import BusRoutes from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  const route = await BusRoutes.findOne({ routeId: id }); // or _id if you prefer
  if (!route) return res.status(404).json({ error: 'Route not found' });

  res.status(200).json({ route });
}
