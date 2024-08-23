import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

function ImageSwipper({ uploadedImages }) {
  const [targetUrl, setTargetUrl] = useState(''); // State to store the URL of the target image
  const [targetImage, setTargetImage] = useState(null); // State to store the uploaded target image file
  const [result, setResult] = useState(null); // State to store the result URL from the face swap API
  const [loading, setLoading] = useState(false); // State to manage loading state
  const [targetPreview, setTargetPreview] = useState(''); // State to store the preview URL of the target image

  // Effect to update target image preview when the image or URL changes
  useEffect(() => {
    if (targetImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetPreview(reader.result);
      };
      reader.readAsDataURL(targetImage); // Convert the file to a data URL for preview
    } else {
      setTargetPreview(targetUrl); // Use the URL directly if no file is uploaded
    }
  }, [targetUrl, targetImage]);

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true while processing

    // Randomly select an image URL from the uploaded images
    const randomIndex = Math.floor(Math.random() * uploadedImages.length);
    const randomSwapImageUrl = uploadedImages[randomIndex];

    // Prepare FormData for the face swap API request
    const formData = new FormData();
    if (targetImage) {
      formData.append('target_image', targetImage); // Append the uploaded image file
    } else {
      formData.append('target_url', targetUrl); // Append the URL if no file is uploaded
    }

    formData.append('swap_url', randomSwapImageUrl); // Append the swap image URL

    try {
      // Make a POST request to the face swap API
      const { data } = await axios.post('https://image-swipper-backend.vercel.app/api/face-swap', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set content type for FormData
        },
      });

      // Update the result state with the URL of the processed image
      setResult(data.image_process_response.result_url);
    } catch (error) {
      console.error('Error:', error); // Log any errors
    }

    setLoading(false); // Set loading to false after processing
  };

  // Function to ensure the URL uses HTTPS
  const ensureHttps = (url) => {
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  // Handler for downloading the result image
  const handleDownload = async () => {
    if (result) {
      try {
        const httpsUrl = ensureHttps(result); // Ensure the URL uses HTTPS
        console.log('Attempting to download image from URL:', httpsUrl);

        // Fetch the image from the backend
        const response = await fetch(`https://image-swipper-backend.vercel.app/api/download-image?url=${encodeURIComponent(httpsUrl)}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Convert the response to a blob and save the file
        const blob = await response.blob();
        saveAs(blob, 'result-image.jpg');

        console.log('Download successful');
      } catch (error) {
        console.error('Download error:', error); // Log any errors during download
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 bg-gray-800 overflow-auto">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Face Swap Tool</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Image URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter target image URL"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Or Upload Target Image</label>
            <input
              type="file"
              onChange={(e) => setTargetImage(e.target.files[0])}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Processing...' : 'Swap Faces'}
          </button>
        </form>

        {targetPreview && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2 text-center">Target Image Preview</h2>
            <img
              src={targetPreview}
              alt="Target Preview"
              className="w-full max-h-48 object-contain"
            />
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2 text-center">Result Image</h2>
            <img
              src={result}
              alt="Result"
              className="w-full max-h-48 object-contain"
            />
            <button
              onClick={handleDownload}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Download Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageSwipper;
