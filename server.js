const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Enable CORS
app.use(cors({
  origin: ['https://lucky-flan-0ed155.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload endpoint
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { filename } = req.body;
    const filePath = req.file.path;

    console.log(`Uploading ${filename} to Cloudinary...`);

    // Upload to Cloudinary with the original filename
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'sifnos_phase_2',
      public_id: filename.replace('.jpg', ''),
      resource_type: 'image'
    });

    // Clean up temp file
    fs.unlinkSync(filePath);

    console.log(`Uploaded: ${result.public_id}`);
    res.json({ 
      success: true, 
      file: {
        url: result.secure_url,
        public_id: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all uploaded photos
app.get('/photos', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'sifnos_phase_2',
      max_results: 500
    });

    res.json({ success: true, photos: result.resources });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a photo
app.post('/delete', async (req, res) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({ success: false, error: 'public_id required' });
    }

    console.log(`Deleting ${public_id} from Cloudinary...`);

    const result = await cloudinary.uploader.destroy(public_id);

    console.log(`Delete result:`, result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Cloudinary upload server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
