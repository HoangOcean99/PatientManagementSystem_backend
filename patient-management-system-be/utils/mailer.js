import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

export const sendMail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        });
    } catch (err) {
        console.error("SendMail Error:", err);
        throw err;
    }
};

export const sendMailWithIcal = async (to, subject, html, icalContent = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        if (icalContent) {
            mailOptions.icalEvent = {
                filename: "invite.ics",
                method: "request",
                content: icalContent,
            };
        }

        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error("SendMailWithIcal Error:", err);
        throw err;
    }
};