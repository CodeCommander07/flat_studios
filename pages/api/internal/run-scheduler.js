// pages/api/scheduler/publish.js (or wherever your handler lives)
import dbConnect from '@/utils/db';
import Content from '@/models/Content';
import { shouldRunScheduler } from '@/utils/lastRun';
import nodemailer from 'nodemailer';
import Subscriber from '@/models/Subscriber'; // see model below

const BATCH_SIZE = 80; // keep under provider limits (adjust as needed)

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildTransport() {
  // Gmail example (you can swap to SMTP host/port if you prefer)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    secure: true,
  });
}

function buildEmail(post) {
  const site = process.env.BASE_URL?.replace(/\/+$/, '') || 'https://example.com';
  const postUrl = `${site}/news/${post.slug || post._id}`;
  const previewText = post.excerpt || post.description || post.title || 'New post published';

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#0b0f13;color:#eaeef2;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#111827;border-radius:12px;overflow:hidden">
            <tr>
              <td style="padding:24px 24px 8px 24px;background:#0f172a;">
                <h1 style="margin:0;color:#fff;font-size:22px;line-height:1.3;">${escapeHtml(post.title || 'New post')}</h1>
                <p style="margin:8px 0 0 0;color:#9ca3af;font-size:14px;">We’ve just published a new update.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 8px 24px;">
                <p style="margin:0 0 12px 0;color:#d1d5db;font-size:15px;line-height:1.6;">
                  ${escapeHtml(previewText).slice(0, 300)}${previewText?.length > 300 ? '…' : ''}
                </p>
                <p style="margin:16px 0 0 0;">
                  <a href="${postUrl}" style="display:inline-block;text-decoration:none;padding:12px 16px;background:#2563eb;color:#fff;border-radius:8px;font-weight:600;">
                    Read the post
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 24px 24px;color:#6b7280;font-size:12px;border-top:1px solid #1f2937;">
                You’re receiving this because you subscribed to email alerts.
                <br/>
                <a href="${site}/email/manage" style="color:#9ca3af;">Manage preferences</a> •
                <a href="${site}/email/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewText)}</div>
  </body>
</html>`;

  const text = `${post.title || 'New post published'}\n\n${previewText}\n\nRead more: ${postUrl}\n\n— You’re receiving this because you subscribed. Manage: ${site}/email/manage  |  Unsubscribe: ${site}/email/unsubscribe`;

  return { html, text, postUrl, subject: `New post: ${post.title || 'Update'}` };
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(req, res) {
  try {
    // Only run if it's been >5 minutes since last time
    if (!shouldRunScheduler(5)) {
      return res.status(200).json({ success: false, message: 'Scheduler recently ran' });
    }

    await dbConnect();

    const now = new Date();
    const posts = await Content.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    let count = 0;
    let notified = 0;

    // Preload subscribers once
    const subscribers = await Subscriber.find(
      { isActive: true, isVerified: { $ne: false } },
      { email: 1, _id: 0 }
    ).lean();

    // Prepare transport (only once)
    const transporter = subscribers.length ? buildTransport() : null;

    for (const post of posts) {
      post.status = 'published';
      post.publishedAt = now;
      post.scheduledFor = undefined;
      await post.save();
      count++;

      // Send alerts for this post (best-effort)
      if (transporter && subscribers.length) {
        const { html, text, subject } = buildEmail(post);

        // Batch BCC to reduce provider complaints; you can flip to one-by-one if desired
        const batches = chunk(subscribers.map(s => s.email), BATCH_SIZE);

        for (const emails of batches) {
          try {
            await transporter.sendMail({
              from: process.env.MAIL_FROM || process.env.MAIL_USER,
              to: process.env.MAIL_FROM || process.env.MAIL_USER, // dummy "To" to avoid empty TO
              bcc: emails,
              subject,
              text,
              html,
              headers: {
                'List-Unsubscribe': `<mailto:${process.env.MAIL_FROM || process.env.MAIL_USER}?subject=unsubscribe>, <${(process.env.BASE_URL || '').replace(/\/+$/,'')}/email/unsubscribe>`,
              },
            });
            notified += emails.length;
          } catch (mailErr) {
            console.error(`✉️  Email batch failed (${emails.length} recipients):`, mailErr?.message || mailErr);
            // continue to next batch; we already published the post
          }
        }
      }
    }

    console.log(`🕒 Scheduler published ${count} post(s); emailed ~${notified} subscriber(s)`);

    return res.status(200).json({
      success: true,
      published: count,
      notified,
      message: `Published ${count} post(s); emailed ${notified} subscriber(s)`,
    });
  } catch (err) {
    console.error('❌ Scheduler error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
