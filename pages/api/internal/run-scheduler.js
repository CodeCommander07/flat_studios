import dbConnect from '@/utils/db';
import Content from '@/models/Content';

export default async function handler(req, res) {
  try {
    await dbConnect();

    const now = new Date();
    const posts = await Content.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    if (!posts.length) {
      return res.status(200).json({ success: true, message: 'No posts to publish' });
    }

    let count = 0;
    for (const post of posts) {
      post.status = 'published';
      post.publishedAt = now;
      post.scheduledFor = undefined;
      await post.save();
      count++;
    }

    return res.status(200).json({
      success: true,
      publishedCount: count,
      message: `Published ${count} post(s)`,
    });
  } catch (err) {
    console.error('❌ Scheduler error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
