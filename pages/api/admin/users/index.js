import dbConnect from '@/utils/db';
import User from '@/models/User';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();
    
    await dbConnect();
    
    try {
        const users = await User.find(); // Exclude password field
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
    }