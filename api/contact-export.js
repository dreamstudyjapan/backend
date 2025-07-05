const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

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
  countryCode: String,
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET allowed' });

  try {
    await connectToDB();
    const contacts = await Contact.find({}).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contacts');

    // Define styled header row
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'DOB - Year', key: 'dobYear', width: 12 },
      { header: 'DOB - Month', key: 'dobMonth', width: 14 },
      { header: 'DOB - Day', key: 'dobDay', width: 12 },
      { header: 'Occupation', key: 'occupation', width: 20 },
      { header: 'Primary Email', key: 'email', width: 25 },
      { header: 'Confirm Email', key: 'cmail', width: 25 },
      { header: 'Country Code', key: 'countryCode', width: 10 },
      { header: 'Phone', key: 'tel', width: 18 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'JLPT Level', key: 'jlpt', width: 10 },
      { header: 'Interested Course', key: 'interestedCourse', width: 25 },
      { header: 'Questions', key: 'questions', width: 30 },
      { header: 'Submitted At', key: 'submittedAt', width: 25 },
    ];

    if (contacts.length === 0) {
      worksheet.addRow(['No data found']);
      worksheet.mergeCells('A2:N2'); // Merge the first 14 columns
      const cell = worksheet.getCell('A2');
      cell.font = { italic: true, bold: true, color: { argb: 'FFFF0000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      contacts.forEach(c => {
        worksheet.addRow({
          ...c,
          submittedAt: new Date(c.submittedAt).toLocaleString(),
        });
      });
    }

    // Style header row
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Apply border and wrapping to all rows
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.alignment = { wrapText: true, vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Send workbook as downloadable file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to export contacts' });
  }
};
