import dbConnect from '@/utils/db';
import Content from '@/models/Content';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    if (req.method === 'GET') {
        const doc = await Content.findById(id).lean();
        if (!doc) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(doc);
    }

    if (req.method === 'PATCH') {
        try {
            const updates = req.body;

            // Always stamp updatedAt
            updates.updatedAt = new Date();

            // Handle publishing logic
            if (updates.status === 'published' && !updates.publishedAt) {
                updates.publishedAt = new Date();
            }

            // If no longer scheduled, remove field
            if (updates.status !== 'scheduled') {
                updates.scheduledFor = undefined;
            }

            // Add revision info if provided
            const revision = {
                editorId: req.user?._id,
                editedAt: new Date(),
                note: req.body?.revisionNote || 'Manual update',
                diff: updates,
            };

            // Update + push to revisions atomically
            const updated = await Content.findByIdAndUpdate(
                id,
                {
                    $set: updates,
                    $push: { revisions: revision },
                },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Post not found' });
            }

            return res.status(200).json(updated);
        } catch (e) {
            console.error('PATCH error:', e);
            return res.status(500).json({ error: 'Failed to update content' });
        }
    }


    if (req.method === 'DELETE') {
        await Content.findByIdAndDelete(id);
        return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
