import React, { useState, useEffect } from "react";
import { PlusCircleIcon, TrashIcon, ChevronLeftIcon } from "@heroicons/react/solid";
import axios from 'axios';

function MediaBar({ toggleMediaBar, onUpload }) {
  const [uploadedImages, setUploadedImages] = useState([]);

  useEffect(() => {
    // Notify parent component of the uploaded images
    onUpload(uploadedImages);
  }, [uploadedImages, onUpload]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const imageUrls = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'rwba17nn'); // Replace with your Cloudinary upload preset

        // Upload to Cloudinary
        const response = await axios.post(`https://api.cloudinary.com/v1_1/dnryho2ce/image/upload`, formData);
        
        const downloadURL = response.data.secure_url;
        imageUrls.push(downloadURL);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
      }
    }

    setUploadedImages((prevImages) => [...prevImages, ...imageUrls]);
  };

  const handleDeleteImage = (urlToDelete) => {
    setUploadedImages((prevImages) =>
      prevImages.filter((url) => url !== urlToDelete)
    );
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-4 overflow-y-auto">
      <button
          onClick={toggleMediaBar}
          className="top-4 ml-72 z-10 bg-gray-700 text-white p-2 rounded-full"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      <div className="flex flex-row-reverse w-full mb-4 gap-4 justify-end items-center ">
        <h2 className="text-xl font-semibold text-white text-center mb-4">Upload Media</h2>
        <div className="flex items-center justify-between mb-4">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center cursor-pointer bg-indigo-600 text-white px-2 py-2 rounded-xl shadow hover:bg-indigo-700"
          >
            <PlusCircleIcon className="h-5 w-5 " />
          </label>
        </div>
      </div>
      <div className="flex-1 w-full items-center">
        <div className="grid grid-cols-2 gap-4">
          {uploadedImages.map((url, index) => (
            <div
              key={index}
              className="relative w-full h-24 overflow-hidden rounded-lg shadow-md"
            >
              <img
                src={url}
                alt={`Uploaded ${index}`}
                className="object-cover w-full h-full"
              />
              <button
                onClick={() => handleDeleteImage(url)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MediaBar;