import dbConnect from '@/utils/db';
import Appeal from '@/models/Appeals';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === "DELETE") {
        const { id } = req.query;
        try {
            const appeal = await Appeal.findByIdAndDelete(id);
            if (!appeal) {
                return res.status(404).json({ message: 'Appeal not found' });
            }
            return res.status(200).json({ message: 'Appeal deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting appeal', error: error.message });
        }
    }

}
