const mongoose = require('mongoose');
const XLSX = require('xlsx');

// MongoDB connection
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

// Schema
const ContactSchema = new mongoose.Schema({
  name: String,
  dobYear: String,
  dobMonth: String,
  dobDay: String,
  occupation: String,
  email: String,
  cmail: String,
  tel: String,
  address: String,
  jlpt: String,
  interestedCourse: String,
  questions: String,
  submittedAt: { type: Date, default: Date.now },
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// API Handler
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET method is allowed' });
  }

  try {
    await connectToDB();
    const contacts = await Contact.find({}).lean();

    // Convert MongoDB documents to Excel worksheet
    const worksheet = XLSX.utils.json_to_sheet(contacts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

    // Generate buffer from workbook
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Export Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to export contacts' });
  }
};
