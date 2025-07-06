import nodemailer from 'nodemailer';

const mailHub = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    secure: true, 
});

export const sendMail = async (to, subject, html) => {


    try {
        const mailOptions = {
            from: "<Flat Studios> <noreply@flatstudios.net>",
            replyTo: "<Support> <help@flatstudios.net>",
            to,
            subject,
            html,
        };

        await mailHub.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}