// pages/api/scheduler/publish.js
import dbConnect from '@/utils/db';
import Content from '@/models/Content';
import { shouldRunScheduler } from '@/utils/lastRun';

export default async function handler(req, res) {
  try {
    // Only run if it's been >5 minutes since last time
    if (!shouldRunScheduler(5)) {
      return res
        .status(200)
        .json({ success: false, message: 'Scheduler recently ran' });
    }

    await dbConnect();

    const now = new Date();
    const posts = await Content.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    let count = 0;

    for (const post of posts) {
      post.status = 'published';
      post.publishedAt = now;
      post.scheduledFor = undefined;
      await post.save();
      count++;
    }

    console.log(`🕒 Scheduler published ${count} post(s)`);

    return res.status(200).json({
      success: true,
      published: count,
      message: `Published ${count} post(s)`,
    });
  } catch (err) {
    console.error('❌ Scheduler error:', err);
    return res
      .status(500)
      .json({ success: false, error: err.message || 'Unknown error' });
  }
}
