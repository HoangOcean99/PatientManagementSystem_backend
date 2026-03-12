import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendMail = async (to, subject, html) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
};

export const sendMailWithIcal = async (to, subject, html, icalContent = null) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html,
    };

    // Nếu có truyền file lịch (icalContent) thì đính kèm vào mail
    if (icalContent) {
        mailOptions.icalEvent = {
            filename: 'invite.ics',
            method: 'request',
            content: icalContent
        };
    }

    await transporter.sendMail(mailOptions);
};
