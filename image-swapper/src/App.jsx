import React, { useState, useEffect } from "react";
import ImageSwipper from "./components/ImageSwipper";
import MediaBar from "./components/MediaBar";
import { ChevronRightIcon } from "@heroicons/react/solid";

function App() {
  const [isMediaBarOpen, setIsMediaBarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Automatically close media bar on smaller screens
      if (window.innerWidth < 768) {
        setIsMediaBarOpen(false);
      }
    };

    // Add event listener on component mount
    window.addEventListener("resize", handleResize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [uploadedImages, setUploadedImages] = useState([]);

  const toggleMediaBar = () => {
    setIsMediaBarOpen(!isMediaBarOpen);
  };

  const handleUploadedImages = (images) => {
    setUploadedImages(images);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-800 relative">
      <div
        className={`fixed top-0 left-0 h-full  bg-gray-900 transition-transform duration-300 ease-in-out z-20 ${
          isMediaBarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "90%", maxWidth: "400px" }} // Adjust width as needed
      >
        <MediaBar toggleMediaBar={toggleMediaBar} onUpload={handleUploadedImages} />
      </div>
      <div
        className={`flex-grow flex items-start justify-center overflow-auto transition-all duration-300 ease-in-out ${
          isMediaBarOpen ? "w-3/4 ml-auto" : "w-full"
        }`}
      >
        <ImageSwipper uploadedImages={uploadedImages} />
      </div>
      {!isMediaBarOpen && (
        <button
          onClick={toggleMediaBar}
          className="absolute top-4 left-4 z-10 bg-gray-700 text-white p-2 rounded-full"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

export default App;

