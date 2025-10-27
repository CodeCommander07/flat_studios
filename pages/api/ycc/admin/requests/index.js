import dbConnect from '@/utils/db';
import OperatorRequest from '@/models/OperatorRequest';
import Question from '@/models/YCCRouteForm';

// Helper: pull a value from structured blocks by label regex
function fromStructured(structured, labelRegex) {
  if (!structured) return null;
  for (const pg of Object.values(structured)) {
    for (const item of pg.items || []) {
      if (labelRegex.test(item.label || '')) return item.answer || null;
    }
  }
  return null;
}

// Helper: build meta for list rows (company, submitter, email, submissionType)
function buildMeta(doc) {
  // Prefer structured (labels), fall back to raw values
  const company =
    fromStructured(doc.structured, /company|selected\s*company/i) ||
    Object.values(doc.formData || {}).find(
      (v) => typeof v === 'string' && /(buses|transport|company)/i.test(v)
    ) ||
    'Unknown Company';

  const submitter =
    fromStructured(doc.structured, /discord\s*tag|discord|name/i) ||
    Object.values(doc.formData || {}).find(
      (v) => typeof v === 'string' && /^[A-Za-z0-9#._-]{3,}$/.test(v)
    ) ||
    'Unknown User';

  const email =
    fromStructured(doc.structured, /email/i) ||
    Object.values(doc.formData || {}).find(
      (v) => typeof v === 'string' && /@/.test(v)
    ) ||
    'unknown@flatstudios.net';

  const submissionType =
    fromStructured(doc.structured, /(submission\s*type|route\s*submission\s*type)/i) ||
    Object.values(doc.formData || {}).find((v) =>
      typeof v === 'string' &&
      /(new route|proposed change|change to an existing route)/i.test(v)
    ) ||
    '—';

  return { company, submitter, email, submissionType };
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET')
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });

  try {
    const requests = await OperatorRequest.find({})
      .sort({ createdAt: -1 })
      .select('_id structured formData status createdAt updatedAt')
      .lean();

    const enriched = requests.map((r) => ({
      _id: r._id,
      status: r.status || 'Pending',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      meta: buildMeta(r), // 👈 add derived fields here
    }));

    res.status(200).json({ success: true, requests: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
