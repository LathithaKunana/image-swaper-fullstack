const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');
const env = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Initialize environment variables
env.config(); // https://image-swapper-frontend.vercel.app/

const app = express();
const port = 3000; // You can use any available port

// Apply CORS middleware globally
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

app.use(express.json());

// Configure your Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/face-swap', upload.fields([{ name: 'target_image' }, { name: 'swap_image' }]), async (req, res) => {
  try {
    const form = new FormData();

    const uploadImage = async (image) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream((error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url); // Get the URL of the uploaded image
        }).end(image.buffer);
      });
    };

    if (req.files['target_image']) {
      const targetImage = req.files['target_image'][0];
      const targetImageUrl = await uploadImage(targetImage);
      form.append('target_url', targetImageUrl);
    } else {
      form.append('target_url', req.body.target_url);
    }

    if (req.files['swap_image']) {
      const swapImage = req.files['swap_image'][0];
      const swapImageUrl = await uploadImage(swapImage);
      form.append('swap_url', swapImageUrl);
    } else {
      form.append('swap_url', req.body.swap_url);
    }

    const rapidApiHost = 'faceswap3.p.rapidapi.com';

    const response = await axios.post(`https://${rapidApiHost}/faceswap/v1/image`, form, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': rapidApiHost,
        ...form.getHeaders(),
      },
    });

    console.log('Initial API Response:', response.data);

    const requestId = response.data.image_process_response.request_id;

    if (!requestId) {
      throw new Error('Request ID not found in API response');
    }

    // Wait for a few seconds before checking for results
    setTimeout(async () => {
      try {
        const resultData = new FormData();
        resultData.append('request_id', requestId);

        const resultResponse = await axios.post(`https://${rapidApiHost}/result/`, resultData, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': rapidApiHost,
            ...resultData.getHeaders(),
          },
        });

        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        console.log('Result API Response:', resultResponse.data);
        res.json(resultResponse.data);
      } catch (error) {
        console.error('Error retrieving result:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the result' });
      }
    }, 1500);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// New endpoint to download the image
app.get('/api/download-image', async (req, res) => {
  const imageUrl = req.query.url;
  
  try {
    // Fetch the image data from the given URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    // Set the response content type to the correct MIME type
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Send the image data back to the client
    res.send(response.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({ error: 'Failed to download image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
