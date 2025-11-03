import cleanupGameData from '@/utils/cleanupGameData';

export default async function handler(req, res) {
  try {
    await cleanupGameData();
    return res.status(200).json({ success: true, message: 'Cleanup completed successfully' });
  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ success: false, error: 'Cleanup failed' });
  }
}
