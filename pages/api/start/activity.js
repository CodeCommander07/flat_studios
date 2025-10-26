import '@/cron/weeklyActivityReport';

export default function handler(req, res) {
  generateWeeklyReport();
  res.status(200).json({ ok: true });
}