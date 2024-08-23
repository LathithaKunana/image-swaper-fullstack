import React, { useState, useEffect } from "react";
import { PlusCircleIcon, TrashIcon, ChevronLeftIcon } from "@heroicons/react/solid";
import axios from 'axios';

function MediaBar({ toggleMediaBar, onUpload }) {
  const [uploadedImages, setUploadedImages] = useState([]); // State to keep track of uploaded image URLs

  useEffect(() => {
    // Notify parent component of the current list of uploaded images
    onUpload(uploadedImages);
  }, [uploadedImages, onUpload]);

  // Handler for file upload
  const handleFileUpload = async (event) => {
    const files = event.target.files; // Get the selected files
    const imageUrls = []; // Array to store the URLs of the uploaded images

    // Iterate over each selected file
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file); // Append file to FormData
        formData.append('upload_preset', 'rwba17nn'); // Cloudinary upload preset

        // Upload the file to Cloudinary
        const response = await axios.post(`https://api.cloudinary.com/v1_1/dnryho2ce/image/upload`, formData);

        const downloadURL = response.data.secure_url; // Get the secure URL of the uploaded image
        imageUrls.push(downloadURL); // Add the URL to the array
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error); // Log any errors
      }
    }

    // Update the state with the newly uploaded images
    setUploadedImages((prevImages) => [...prevImages, ...imageUrls]);
  };

  // Handler to delete an image
  const handleDeleteImage = (urlToDelete) => {
    setUploadedImages((prevImages) =>
      prevImages.filter((url) => url !== urlToDelete) // Filter out the image to delete
    );
  };

  return (
    <div className="flex flex-col items-center justify-start h-full p-4 overflow-y-auto">
      {/* Button to toggle the visibility of the media bar */}
      <button
          onClick={toggleMediaBar}
          className="top-4 ml-72 z-10 bg-gray-700 text-white p-2 rounded-full"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      
      <div className="flex flex-row-reverse w-full mb-4 gap-4 justify-end items-center">
        <h2 className="text-xl font-semibold text-white text-center mb-4">Upload Media</h2>
        <div className="flex items-center justify-between mb-4">
          {/* Hidden file input */}
          <input
            type="file"
            multiple
            onChange={handleFileUpload} // Trigger file upload handler
            className="hidden"
            id="file-upload"
          />
          {/* Label styled as a button for file input */}
          <label
            htmlFor="file-upload"
            className="flex items-center cursor-pointer bg-indigo-600 text-white px-2 py-2 rounded-xl shadow hover:bg-indigo-700"
          >
            <PlusCircleIcon className="h-5 w-5" />
          </label>
        </div>
      </div>
      
      <div className="flex-1 w-full items-center">
        {/* Grid to display uploaded images */}
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
              {/* Button to delete an image */}
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
