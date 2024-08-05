import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {saveAs} from 'file-saver'

function ImageSwipper() {
  const [targetUrl, setTargetUrl] = useState('');
  const [swapUrl, setSwapUrl] = useState('');
  const [targetImage, setTargetImage] = useState(null);
  const [swapImage, setSwapImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetPreview, setTargetPreview] = useState('');
  const [swapPreview, setSwapPreview] = useState('');

  useEffect(() => {
    // Update target preview when URL or file changes
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

  useEffect(() => {
    // Update swap preview when URL or file changes
    if (swapImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSwapPreview(reader.result);
      };
      reader.readAsDataURL(swapImage);
    } else {
      setSwapPreview(swapUrl);
    }
  }, [swapUrl, swapImage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (targetImage) {
      formData.append('target_image', targetImage);
    } else {
      formData.append('target_url', targetUrl);
    }

    if (swapImage) {
      formData.append('swap_image', swapImage);
    } else {
      formData.append('swap_url', swapUrl);
    }

    try {
      const { data } = await axios.post('http://localhost:3000/api/face-swap', formData, {
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Face Swap Tool</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Target Image URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter target image URL"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {targetPreview && (
              <img src={targetPreview} alt="Target Preview" className="mt-2 w-full max-h-64 object-cover rounded-md shadow-md" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Swap Image URL</label>
            <input
              type="text"
              value={swapUrl}
              onChange={(e) => setSwapUrl(e.target.value)}
              placeholder="Enter swap image URL"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {swapPreview && (
              <img src={swapPreview} alt="Swap Preview" className="mt-2 w-full max-h-64 object-cover rounded-md shadow-md" />
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700">Target Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTargetImage(e.target.files[0])}
                className="mt-1 block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700">Swap Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSwapImage(e.target.files[0])}
                className="mt-1 block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900">Result</h2>
            <img src={result} alt="Result" className="mt-4 max-w-full h-auto rounded-md shadow-md" />
            <button
              onClick={handleDownload}
              className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
