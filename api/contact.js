const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// CORS setup helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST method is allowed' });

  const {
    name,
    email,
    cmail,
    occupation,
    tel,
    countryCode,
    address,
    dobYear,
    dobMonth,
    dobDay,
    jlpt,
    interestedCourse,
    questions,
  } = req.body;

  // Auto-reply to user

  const autoReply = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank You for Your Inquiry – Setu to Japan',
    text: `Dear ${name} San,

Thank you for contacting Setu to Japan – your bridge to learning Japanese in Japan!

We have received your inquiry successfully. Our team will review your details and get back to you shortly.

If you have any urgent questions, feel free to reply to this email.

In the meantime, we invite you to explore our website for more details:
🌐 https://dreamstudyjapan.com

We appreciate your interest and look forward to helping you start your journey of studying in Japan.

Warm regards,
Founder – Setu to Japan
📧 dreamstudy.workjapan@gmail.com`
  };

  // Full contact details to website owner
  const notifyOwner = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Contact Form Submission',
    text: `
📩 New Contact Form Submission:

Name: ${name}
Email: ${email}
Confirm Email: ${cmail}
Phone: ${countryCode}-${tel}
DOB: ${dobDay}-${dobMonth}-${dobYear}
Occupation: ${occupation}
Address: ${address}
JLPT: ${jlpt}
Interested Course: ${interestedCourse}
Questions: ${questions}
    `,
  };

  try {
    await transporter.sendMail(autoReply);
    await transporter.sendMail(notifyOwner);

    return res.status(200).json({ success: true, message: 'Emails sent successfully' });
  } catch (err) {
    console.error('Mail Send Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to send emails' });
  }
};
