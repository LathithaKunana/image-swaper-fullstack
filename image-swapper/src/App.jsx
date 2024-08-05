import React, { useState } from "react";
import ImageSwipper from "./components/ImageSwipper";
import MediaBar from "./components/MediaBar";
import { ChevronRightIcon } from "@heroicons/react/solid";

function App() {
  const [isMediaBarOpen, setIsMediaBarOpen] = useState(false);

  const toggleMediaBar = () => {
    setIsMediaBarOpen(!isMediaBarOpen);
  };

  return (
    <div className="flex flex-row h-screen bg-gray-800 overflow-hidden">
      <div
        className={`${
          isMediaBarOpen ? "w-1/4" : "w-0"
        } bg-gray-900 transition-width duration-300 ease-in-out overflow-hidden`}
      >
        <MediaBar toggleMediaBar={toggleMediaBar} />
      </div>
      <div
        className={`flex-grow flex items-center justify-center transition-all duration-300 ease-in-out ${
          isMediaBarOpen ? "w-3/4" : "w-full"
        }`}
      >
        <ImageSwipper />
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

