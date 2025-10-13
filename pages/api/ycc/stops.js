import dbConnect from '@/utils/db';
import BusStops from '@/models/BusStops';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const stops = await BusStops.find().select('stopId name town');
    res.status(200).json({ success: true, stops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}
