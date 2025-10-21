import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Submission from '@/models/SubmittedApplication';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    await dbConnect();

    // Find submissions in the talent pool
    const talentPoolSubs = await Submission.find({ status: 'talented' });
    console.log(`Found ${talentPoolSubs.length} talent pool submissions`);

    if (!talentPoolSubs.length) {
      return NextResponse.json({ message: 'No talent pool submissions found' });
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let emailCount = 0;

    // Loop through each submission and send email
    for (const sub of talentPoolSubs) {
      if (!sub.applicantEmail) continue;

      const html = `
        <p>Hello ${sub.applicantName || 'Applicant'},</p>
        <p>There is currently no update on your application in our talent pool. We will contact you if there are any changes.</p>
        <p>Thank you for your patience,<br>FlatStudios Team</p>
      `;

      await transporter.sendMail({
        from: `"FlatStudios Team" <${process.env.MAIL_USER}>`,
        to: sub.applicantEmail,
        subject: "Talent Pool Update",
        html,
      });

      emailCount++;
    }

    return NextResponse.json({ 
      message: `Talent pool check completed. ${emailCount} emails sent.` 
    });
  } catch (error) {
    console.error('Error in talent pool cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';