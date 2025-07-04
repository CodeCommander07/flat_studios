import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler( req, res) {
    await dbConnect();

    const appeals = await Appeal.find({ status: { $in: 'Pending' } });

        res.status(200).json( appeals );

}
