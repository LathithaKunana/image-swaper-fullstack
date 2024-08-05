// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmMTGvIcoXot51yVCrZe5l4UaOrhp60v8",
  authDomain: "image-swapper.firebaseapp.com",
  projectId: "image-swapper",
  storageBucket: "image-swapper.appspot.com",
  messagingSenderId: "907685443986",
  appId: "1:907685443986:web:fad45cfc18e3710f69294b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);