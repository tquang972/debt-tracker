import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCfsNlaVRn0SG-lShPngu37D6AKEXVebb8",
    authDomain: "debt-tracker-cf9e6.firebaseapp.com",
    projectId: "debt-tracker-cf9e6",
    storageBucket: "debt-tracker-cf9e6.firebasestorage.app",
    messagingSenderId: "804807373024",
    appId: "1:804807373024:web:1f7e6943e55668cf39e085",
    measurementId: "G-812W9QY820"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
