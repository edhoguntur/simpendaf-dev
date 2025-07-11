// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPtAKHK99V3CSmUZcfiyOyJxnRiIg0Wm8",
  authDomain: "pendaftaran-b6b23.firebaseapp.com",
  projectId: "pendaftaran-b6b23",
  storageBucket: "pendaftaran-b6b23.firebasestorage.app",
  messagingSenderId: "894764613170",
  appId: "1:894764613170:web:a5c7ef258b488f9d5b462b",
  measurementId: "G-T18GZSV9Y0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };