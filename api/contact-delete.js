const mongoose = require('mongoose');

// MongoDB connection setup
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

// Contact Schema
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

// Avoid re-registering the model
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// API handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Only DELETE method is allowed' });
  }

  try {
    await connectToDB();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Missing email in request body' });
    }

    // Delete the contact by email
    const deleted = await Contact.findOneAndDelete({ email });

    if (!deleted) {
      return res.status(404).json({ success: false, error: `Contact with email ${email} not found` });
    }

    return res.status(200).json({
      success: true,
      message: `Contact with email ${email} deleted successfully`,
      deletedContact: deleted
    });
  } catch (err) {
    console.error('Delete Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
};
