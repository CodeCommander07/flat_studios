import GameData from '@/models/GameData';
import dbConnect from '@/utils/db';

export default async function cleanupGameData() {
  await dbConnect();

  const now = new Date();

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  try {
    // 🧹 Remove unflagged servers older than 14 days
    const deletedNormal = await GameData.deleteMany({
      flagged: { $ne: true },
      updatedAt: { $lt: fourteenDaysAgo },
    });

    // 🧹 Remove flagged servers older than 90 days
    const deletedFlagged = await GameData.deleteMany({
      flagged: true,
      updatedAt: { $lt: ninetyDaysAgo },
    });

    console.log(
      `🧹 Cleanup complete: ${deletedNormal.deletedCount} unflagged, ${deletedFlagged.deletedCount} flagged deleted`
    );
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
}
