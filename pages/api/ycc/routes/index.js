import dbConnect from '@/utils/db';
import BusRoutes from '@/models/BusRoutes';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const routes = await BusRoutes.find().select('routeId number origin destination');
    res.status(200).json({ success: true, routes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}
