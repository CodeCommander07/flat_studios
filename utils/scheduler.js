import cron from 'node-cron';
import dbConnect from '@/utils/db';
import Content from '@/models/Content';

/**
 * Schedules automatic publishing of posts.
 * Runs every minute and publishes anything scheduledFor <= now.
 */
export function startContentScheduler() {
  console.log('🕒 Content Scheduler initialized.');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await dbConnect();
      const now = new Date();

      const scheduledPosts = await Content.find({
        status: 'scheduled',
        scheduledFor: { $lte: now },
      });

      for (const post of scheduledPosts) {
        post.status = 'published';
        post.publishedAt = now;
        post.scheduledFor = undefined;
        await post.save();
        console.log(`✅ Auto-published: ${post.title}`);
      }
    } catch (err) {
      console.error('❌ Scheduler error:', err);
    }
  });
}
