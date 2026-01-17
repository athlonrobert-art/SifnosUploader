const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS for your frontend
app.use(cors());
app.use(express.json());

// Google Drive configuration
const FOLDER_ID = '10PC65_ckxcQfd2annMouSGS_RKu5hwSJ';

// You'll need to create a service account and download the credentials JSON
// Instructions below
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { filename } = req.body;
    const filePath = req.file.path;

    console.log(`Uploading ${filename} to Google Drive...`);

    const fileMetadata = {
      name: filename,
      parents: [FOLDER_ID],
    };

    const media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // Clean up temp file
    fs.unlinkSync(filePath);

    console.log(`Uploaded: ${response.data.name}`);
    res.json({ success: true, file: response.data });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
