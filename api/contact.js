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
    subject: 'Thank you for contacting us!',
    text: `Hi ${name},

Thank you for contacting us. We’ve received your message and will get back to you shortly.

Regards,  
Study in Japan Team
    `,
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
Phone: (${countryCode}) ${tel}
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
