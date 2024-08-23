const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');
const env = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Initialize environment variables from .env file
env.config(); // Load environment variables from the .env file

const app = express();
const port = 3000; // Server port

// Apply CORS middleware globally to allow requests from the specified origin
app.use(
  cors({
    origin: 'https://image-swapper-frontend.vercel.app', // Allow requests from this frontend URL
  })
);

app.use(express.json()); // Middleware to parse JSON bodies

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Endpoint for face swapping
app.post('/api/face-swap', upload.fields([{ name: 'target_image' }, { name: 'swap_image' }]), async (req, res) => {
  try {
    // Create a new FormData instance to send files to the face swap API
    const form = new FormData();

    // Helper function to upload an image to Cloudinary and return the URL
    const uploadImage = async (image) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream((error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url); // Return the URL of the uploaded image
        }).end(image.buffer);
      });
    };

    // Handle target image upload or use provided URL
    let targetImageUrl = req.body.target_url;
    let swapImageUrl = req.body.swap_url;

    if (req.files['target_image']) {
      const targetImage = req.files['target_image'][0];
      targetImageUrl = await uploadImage(targetImage); // Upload image to Cloudinary
      form.append('target_url', targetImageUrl); // Append URL to FormData
    } else {
      form.append('target_url', targetImageUrl);
    }

    // Handle swap image upload or use provided URL
    if (req.files['swap_image']) {
      const swapImage = req.files['swap_image'][0];
      swapImageUrl = await uploadImage(swapImage); // Upload image to Cloudinary
      form.append('swap_url', swapImageUrl); // Append URL to FormData
    } else {
      form.append('swap_url', swapImageUrl);
    }

    // Log URLs for debugging
    console.log('Target URL:', targetImageUrl);
    console.log('Swap URL:', swapImageUrl);

    // Define the RapidAPI host for face swapping
    const rapidApiHost = 'faceswap3.p.rapidapi.com';

    // Make a request to the face swap API
    const response = await axios.post(`https://${rapidApiHost}/faceswap/v1/image`, form, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY, // RapidAPI key
        'x-rapidapi-host': rapidApiHost, // RapidAPI host
        ...form.getHeaders(), // FormData headers
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
        resultData.append('request_id', requestId); // Append request ID to FormData

        // Fetch the result from the face swap API
        const resultResponse = await axios.post(`https://${rapidApiHost}/result/`, resultData, {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': rapidApiHost,
            ...resultData.getHeaders(),
          },
        });

        // Allow requests from the frontend URL
        res.setHeader('Access-Control-Allow-Origin', 'https://image-swapper-frontend.vercel.app');
        console.log('Result API Response:', resultResponse.data);
        res.json(resultResponse.data); // Send the result back to the client
      } catch (error) {
        console.error('Error retrieving result:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the result' });
      }
    }, 1800); // Wait for 1.8 seconds before checking for results
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// New endpoint to download an image by URL
app.get('/api/download-image', async (req, res) => {
  const imageUrl = req.query.url; // Get image URL from query parameters
  
  try {
    // Fetch image data from the provided URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    // Set the response content type to match the fetched image
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Send the image data back to the client
    res.send(response.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({ error: 'Failed to download image' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
