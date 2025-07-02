const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((conn) => conn);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Reuse existing schema
const ContactSchema = new mongoose.Schema({
  name: String,
  dobYear: String,
  dobMonth: String,
  dobDay: String,
  occupation: String,
  email: String,
  cmail: String,
  tel: String,
  countryCode: String,
  address: String,
  jlpt: String,
  interestedCourse: String,
  questions: String,
  submittedAt: { type: Date, default: Date.now },
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

module.exports = async (req, res) => {
  // ✅ Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET method is allowed' });
  }

  try {
    await connectToDB();

    const contacts = await Contact.find({}).sort({ submittedAt: -1 }); // newest first

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (err) {
    console.error('MongoDB Fetch Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
};
