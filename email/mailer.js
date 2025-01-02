const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.GMAIL_EMAIL,
		pass: process.env.GMAIL_PASSWORD,
	},
});

const sendEmail = (to, subject, text) => {
	const mailOptions = {
		from: process.env.GMAIL_EMAIL,
		to,
		subject,
		text,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error("Error sending email:", error);
		} else {
			console.log("Email sent:", info.response);
		}
	});
};

module.exports = sendEmail;
