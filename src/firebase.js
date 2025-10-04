// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Import pour Auth & Firestore
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8A04r-ww50b2RMIDG8VstMUfCHHWg_kM",
  authDomain: "coree-2f526.firebaseapp.com",
  projectId: "coree-2f526",
  storageBucket: "coree-2f526.firebasestorage.app",
  messagingSenderId: "182801174771",
  appId: "1:182801174771:web:f39c8caf4b8b477d992786",
  measurementId: "G-QZJ3Y1J7EW"
};

// Initialize Firebase
// Init Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const DEFAULT_GROUP_ID = "main";

// ⚠️ Forcer un transport compatible (réseaux/proxy/extension stricts)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // évite WebChannel
  useFetchStreams: false,             // évite fetch streaming (certains proxys le cassent)
});