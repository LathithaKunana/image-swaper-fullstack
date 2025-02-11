import React, { useState, useEffect } from "react";
import ImageSwipper from "./components/ImageSwipper";
import MediaBar from "./components/MediaBar";
import { ChevronRightIcon } from "@heroicons/react/solid";

function App() {
  // State to control the visibility of the media bar
  const [isMediaBarOpen, setIsMediaBarOpen] = useState(false);

  // Effect to handle screen resize and automatically close media bar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMediaBarOpen(false); // Close media bar if screen width is less than 768px
      }
    };

    // Add event listener for resize event
    window.addEventListener("resize", handleResize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // State to store the uploaded images
  const [uploadedImages, setUploadedImages] = useState([]);

  // Toggle the visibility of the media bar
  const toggleMediaBar = () => {
    setIsMediaBarOpen(!isMediaBarOpen);
  };

  // Handler to receive uploaded images from MediaBar component
  const handleUploadedImages = (images) => {
    setUploadedImages(images);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-200 relative">
      {/* MediaBar component */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-500 transition-transform duration-300 ease-in-out z-20 ${
          isMediaBarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "90%", maxWidth: "400px" }} // Adjust width as needed
      >
        <MediaBar toggleMediaBar={toggleMediaBar} onUpload={handleUploadedImages} />
      </div>
      
      {/* Main content area */}
      <div
        className={`flex-grow flex items-start justify-center overflow-auto transition-all duration-300 ease-in-out ${
          isMediaBarOpen ? "w-3/4 ml-auto" : "w-full"
        }`}
      >
        <ImageSwipper uploadedImages={uploadedImages} />
      </div>
      
      {/* Button to open the media bar */}
      {!isMediaBarOpen && (
        <button
          onClick={toggleMediaBar}
          className="absolute top-4 left-4 z-10 bg-fuchsia-600 text-white p-2 rounded-full"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default App;
