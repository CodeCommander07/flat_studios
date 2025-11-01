// pages/api/newsletter/subscribe.js
import dbConnect from '@/utils/db';
import Subscriber from '@/models/Subscriber';
import Content from '@/models/Content';
import nodemailer from 'nodemailer';

const SITE = (process.env.BASE_URL || 'https://yapton.vercel.app').replace(/\/+$/, '');
const FROM = "Yapton & District <" + (process.env.MAIL_FROM || process.env.MAIL_USER) + ">";

function createTransport() {
  if (process.env.MAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    secure: true,
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// 📰 Build the HTML section for latest posts
function renderPostsHTML(posts) {
  if (!posts?.length) return '';

  return posts
    .map((post, i) => {
      const isEven = i % 2 === 0;
      const imageUrl =
        post.coverImage ||
        post.image ||
        `${SITE}/logo.png`; // fallback image
      const url = `${SITE}/content/${post.slug || post._id}`;
      const excerpt =
        escapeHtml(post.excerpt || post.description || '').slice(0, 160) +
        (post.description?.length > 160 ? '…' : '');

      return `
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                ${
                  isEven
                    ? `
                  <td width="40%" valign="top" style="padding-right:16px;">
                    <img src="${imageUrl}" width="100%" alt="${escapeHtml(
                        post.title
                      )}" style="border-radius:8px;display:block;">
                  </td>
                  <td valign="top">
                    <h3 style="margin:0 0 8px 0;color:#fff;font-size:18px;">${escapeHtml(
                      post.title
                    )}</h3>
                    <p style="margin:0 0 12px 0;color:#d1d5db;font-size:14px;line-height:1.6;">${excerpt}</p>
                    <a href="${url}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Read more →</a>
                  </td>
                `
                    : `
                  <td valign="top" style="padding-right:16px;">
                    <h3 style="margin:0 0 8px 0;color:#fff;font-size:18px;">${escapeHtml(
                      post.title
                    )}</h3>
                    <p style="margin:0 0 12px 0;color:#d1d5db;font-size:14px;line-height:1.6;">${excerpt}</p>
                    <a href="${url}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Read more →</a>
                  </td>
                  <td width="40%" valign="top">
                    <img src="${imageUrl}" width="100%" alt="${escapeHtml(
                        post.title
                      )}" style="border-radius:8px;display:block;">
                  </td>
                `
                }
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join('');
}

function welcomeEmailTemplate(email, posts = []) {
  const manageUrl = `${SITE}/email/manage`;
  const unsubUrl = `${SITE}/email/unsubscribe`;
  const subject = `Welcome to Yapton & District updates`;
  const preheader = `Thanks for subscribing — here are some of our latest articles.`;

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;color:#eaeef2;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#283335;border-radius:12px;overflow:hidden;">
            
            <!-- Header -->
            <tr>
              <td style="padding:24px;background:#283335;">
                <table width="100%">
                  <tr>
                    <td>
                      <h1 style="margin:0;color:#fff;font-size:22px;">Welcome to Yapton & District</h1>
                      <p style="margin:8px 0 0 0;color:#9ca3af;font-size:14px;">You’re all set, ${escapeHtml(
                        email
                      )}.</p>
                    </td>
                    <td align="right">
                      <img src="https://yapton.vercel.app/logo.png" width="40" height="40" alt="Logo" style="border-radius:8px;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Intro -->
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 12px 0;color:#d1d5db;font-size:15px;line-height:1.6;">
                  Thanks for subscribing to Yapton &amp; District updates! You’ll now receive news, announcements, and posts from us.
                </p>
              </td>
            </tr>

            <!-- Latest Posts -->
            ${
              posts.length
                ? `<tr><td style="padding:0 24px;"><h2 style="color:#fff;font-size:20px;margin-bottom:8px;">Recent Articles</h2></td></tr>${renderPostsHTML(
                    posts
                  )}`
                : ''
            }

            <!-- Footer -->
            <tr>
              <td style="padding:18px 24px 24px 24px;color:#6b7280;font-size:12px;border-top:1px solid #1f2937;">
                You can unsubscribe anytime:
                <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  </body>
</html>`;

  const text = `Welcome to Yapton & District updates!

Thanks for subscribing — here are some of our latest articles:
${posts
  .map((p) => `• ${p.title}: ${SITE}/news/${p.slug || p._id}`)
  .join('\n')}

Manage: ${manageUrl}
Unsubscribe: ${unsubUrl}
`;

  return {
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${FROM}?subject=unsubscribe>, <${unsubUrl}>`,
    },
  };
}

async function sendWelcomeEmail(to) {
  try {
    await dbConnect();
    const posts = await Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    const transporter = createTransport();
    const { subject, html, text, headers } = welcomeEmailTemplate(to, posts);
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
      text,
      headers,
    });
    return true;
  } catch (err) {
    console.error('Welcome email send failed:', err?.message || err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email' });

  try {
    const existing = await Subscriber.findOne({ email });
    let firstSubscribe = false;

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        firstSubscribe = true;
      }
    } else {
      await Subscriber.create({ email, isActive: true, isVerified: true });
      firstSubscribe = true;
    }

    if (firstSubscribe) {
      sendWelcomeEmail(email);
    }

    return res.status(200).json({
      success: true,
      message: firstSubscribe
        ? 'Subscribed and welcome email sent (with latest articles).'
        : 'Already subscribed.',
    });
  } catch (err) {
    console.error('Subscription error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
