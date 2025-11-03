import GameData from '@/models/GameData';

export default async function cleanupGameData() {
  const now = new Date();

  // ⚙️ Delete unflagged after 14 days
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ⚙️ Delete flagged after 90 days
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Unflagged servers
  const deletedNormal = await GameData.deleteMany({
    flagged: { $ne: true },
    updatedAt: { $lt: fourteenDaysAgo },
  });

  // Flagged servers
  const deletedFlagged = await GameData.deleteMany({
    flagged: true,
    updatedAt: { $lt: ninetyDaysAgo },
  });

  if (deletedNormal.deletedCount > 0 || deletedFlagged.deletedCount > 0) {
    console.log(
      `🧹 Cleanup: Removed ${deletedNormal.deletedCount} normal + ${deletedFlagged.deletedCount} flagged old servers.`
    );
  }
}
