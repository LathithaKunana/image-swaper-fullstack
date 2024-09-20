const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const cors = require('cors');
const env = require('dotenv');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

const canvas = require('@napi-rs/canvas');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = canvas;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

env.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const loadFaceApiModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
};
loadFaceApiModels();

app.post(
  '/api/face-swap',
  upload.fields([{ name: 'target_image' }, { name: 'swap_image' }]),
  async (req, res) => {
    try {
      console.log('Received request:', req.body);
      console.log('Received files:', req.files);

      const form = new FormData();

      const uploadImage = async (image) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream((error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }).end(image.buffer);
        });
      };

      let targetImageUrl = req.body.target_url;
      let swapImageUrl = req.body.swap_url;

      console.log('Form Data:', form);
      console.log('Initial target URL:', targetImageUrl);
      console.log('Initial swap URL:', swapImageUrl);

      if (req.files['target_image']) {
        const targetImage = req.files['target_image'][0];
        targetImageUrl = await uploadImage(targetImage);
        form.append('target_url', targetImageUrl);
        console.log('Uploaded target image:', targetImageUrl);
      } else {
        form.append('target_url', targetImageUrl);
      }

      if (req.files['swap_image']) {
        const swapImage = req.files['swap_image'][0];
        swapImageUrl = await uploadImage(swapImage);
        form.append('swap_url', swapImageUrl);
        console.log('Uploaded swap image:', swapImageUrl);
      } else {
        form.append('swap_url', swapImageUrl);
      }

      const mode = req.body.mode || 'merge';
      console.log('Mode:', mode);

      if (mode === 'align') {
        try {
          console.log('Starting face alignment...');

          // Fetch the images as buffers
          const targetImageBuffer = await axios
            .get(targetImageUrl, { responseType: 'arraybuffer' })
            .then((res) => res.data);
          const swapImageBuffer = await axios
            .get(swapImageUrl, { responseType: 'arraybuffer' })
            .then((res) => res.data);

          // Process images using sharp
          const targetImage = sharp(targetImageBuffer);
          const swapImage = sharp(swapImageBuffer);

          // Get metadata for both images
          const [targetMeta, swapMeta] = await Promise.all([
            targetImage.metadata(),
            swapImage.metadata()
          ]);

          // Calculate dimensions for the half faces
          const halfWidth = Math.min(targetMeta.width, swapMeta.width) / 2;
          const height = Math.min(targetMeta.height, swapMeta.height);

          // Extract left half of target image
          const leftHalf = await targetImage
            .extract({ left: 0, top: 0, width: halfWidth, height })
            .toBuffer();

          // Extract right half of swap image
          const rightHalf = await swapImage
            .extract({ left: swapMeta.width - halfWidth, top: 0, width: halfWidth, height })
            .toBuffer();

          // Combine both halves
          const finalImage = await sharp({
            create: {
              width: halfWidth * 2,
              height,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            }
          })
            .composite([
              { input: leftHalf, left: 0, top: 0 },
              { input: rightHalf, left: halfWidth, top: 0 }
            ])
            .png()
            .toBuffer();

          // Upload final image to Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream((error, result) => {
              if (error) reject(error);
              else resolve(result);
            }).end(finalImage);
          });

          console.log('Uploaded final aligned image:', uploadResult.secure_url);

          res.json({
            image_process_response: {
              result_url: uploadResult.secure_url,
            },
          });
        } catch (error) {
          console.error('Error processing face alignment:', error);
          res
            .status(500)
            .json({ error: 'An error occurred while processing the images.' });
        }
      } else if (mode === 'merge') {
        console.log('Starting face merge...');

        const rapidApiHost = 'faceswap3.p.rapidapi.com';

        try {
          const response = await axios.post(
            `https://${rapidApiHost}/faceswap/v1/image`,
            form,
            {
              headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': rapidApiHost,
                ...form.getHeaders(),
              },
            }
          );

          console.log('API Response:', response.data);
          const requestId = response.data.image_process_response.request_id;
          console.log('Received request_id:', requestId);

          setTimeout(async () => {
            try {
              if (!requestId) {
                console.error(
                  'Request ID is undefined in response:',
                  response.data
                );
                return res
                  .status(500)
                  .json({ error: 'Failed to retrieve request ID' });
              }

              const resultData = new FormData();
              resultData.append('request_id', requestId);

              const resultResponse = await axios.post(
                `https://${rapidApiHost}/result/`,
                resultData,
                {
                  headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': rapidApiHost,
                  },
                }
              );

              res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
              console.log('Result API Response:', resultResponse.data);
              res.json(resultResponse.data);
            } catch (error) {
              console.error('Error retrieving result:', error);
              res
                .status(500)
                .json({ error: 'An error occurred while retrieving the result' });
            }
          }, 1800); // Adjust delay if necessary
        } catch (error) {
          console.error('Error processing face merge:', error);
          res.status(500).json({ error: 'An error occurred during face merge' });
        }
      } else {
        res.status(400).json({ error: 'Invalid mode specified' });
      }
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

app.get('/api/download-image', async (req, res) => {
  const imageUrl = req.query.url;

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    res.setHeader('Content-Type', response.headers['content-type']);

    res.send(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download image' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
