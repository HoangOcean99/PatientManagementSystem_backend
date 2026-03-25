import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendMail = async (to, subject, html) => {
    try {
        await sgMail.send({
            to,
            from: process.env.EMAIL_USER,
            subject,
            html,
        });
    } catch (err) {
        console.error("SendMail Error:", err.response?.body || err.message);
        throw err;
    }
};

export const sendMailWithIcal = async (to, subject, html, icalContent = null) => {
    try {
        const msg = {
            to,
            from: process.env.EMAIL_USER,
            subject,
            html,
        };

        if (icalContent) {
            msg.attachments = [
                {
                    content: Buffer.from(icalContent).toString("base64"),
                    filename: "invite.ics",
                    type: "text/calendar",
                    disposition: "attachment",
                },
            ];
        }

        await sgMail.send(msg);
    } catch (err) {
        console.error("SendMailWithIcal Error:", err.response?.body || err.message);
        throw err;
    }
};