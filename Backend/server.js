const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');
const env = require('dotenv');

// Initialize environment variables
env.config(); // https://image-swapper-frontend.vercel.app/

const app = express();
const port = 3000; // You can use any available port

// const corsOptions = {
//     origin: "https://image-swapper-frontend.vercel.app",
//     optionsSuccessStatus: 200,
// };

// Apply CORS middleware globally
app.use(cors({
    origin: 'https://image-swapper-frontend.vercel.app' 
  }));

app.use(express.json());

// Set up multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/face-swap', upload.fields([{ name: 'target_image' }, { name: 'swap_image' }]), async (req, res) => {
  const { target_url, swap_url } = req.body;
  const targetImage = req.files['target_image'] ? req.files['target_image'][0] : null;
  const swapImage = req.files['swap_image'] ? req.files['swap_image'][0] : null;

  try {
    const form = new FormData();

    if (targetImage) {
      form.append('target_image', targetImage.buffer, targetImage.originalname);
    } else {
      form.append('target_url', target_url);
    }

    if (swapImage) {
      form.append('swap_image', swapImage.buffer, swapImage.originalname);
    } else {
      form.append('swap_url', swap_url);
    }

    const rapidApiHost = 'faceswap3.p.rapidapi.com';

    const response = await axios.post(`https://${rapidApiHost}/faceswap/v1/image`, form, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': rapidApiHost,
        ...form.getHeaders(),
      },
    });

    // Log the response to check its structure
    console.log('Initial API Response:', response.data);

    // Access request_id from the nested structure
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

        res.setHeader('Access-Control-Allow-Origin', 'https://image-swapper-frontend.vercel.app');
        console.log('Result API Response:', resultResponse.data);
        res.json(resultResponse.data);
      } catch (error) {
        console.error('Error retrieving result:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the result' });
      }
    }, 5000); // Adjust the delay as needed
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
