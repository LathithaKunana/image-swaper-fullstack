import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

function ImageSwipper({ uploadedImages }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [targetImage, setTargetImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetPreview, setTargetPreview] = useState('');
  const [isMergeMode, setIsMergeMode] = useState(true); // New state for toggle

  useEffect(() => {
    if (targetImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetPreview(reader.result);
      };
      reader.readAsDataURL(targetImage);
    } else {
      setTargetPreview(targetUrl);
    }
  }, [targetUrl, targetImage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const randomIndex = Math.floor(Math.random() * uploadedImages.length);
    const randomSwapImageUrl = uploadedImages[randomIndex];

    const formData = new FormData();
    if (targetImage) {
      formData.append('target_image', targetImage);
    } else {
      formData.append('target_url', targetUrl);
    }
    formData.append('swap_url', randomSwapImageUrl);
    formData.append('mode', isMergeMode ? 'merge' : 'align'); // Add mode to form data

    try {
      const { data } = await axios.post('https://image-swipper-backend.vercel.app/api/face-swap', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(data.image_process_response.result_url);
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const ensureHttps = (url) => {
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  const handleDownload = async () => {
    if (result) {
      try {
        const httpsUrl = ensureHttps(result);
        console.log('Attempting to download image from URL:', httpsUrl);

        const response = await fetch(`https://image-swipper-backend.vercel.app/api/download-image?url=${encodeURIComponent(httpsUrl)}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        saveAs(blob, 'result-image.jpg');

        console.log('Download successful');
      } catch (error) {
        console.error('Download error:', error);
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isMergeMode}
                onChange={() => setIsMergeMode(!isMergeMode)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                {isMergeMode ? 'Merge' : 'Align'}
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Processing...' : isMergeMode ? 'Swap Faces' : 'Align Faces'}
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