import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler( req, res) {

  await dbConnect();

  const data = await req.body

  const appeal = new Appeal(data);
  await appeal.save();

 res.status(200).json({ message: 'Appeal submitted successfully' });
}
