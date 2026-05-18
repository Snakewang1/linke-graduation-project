import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAV5GC6NACPlh8Jrc8aZQoBg54NfAph1uY",
  authDomain: "linke-1d4bc.firebaseapp.com",
  projectId: "linke-1d4bc",
  storageBucket: "linke-1d4bc.firebasestorage.app",
  messagingSenderId: "819966560552",
  appId: "1:819966560552:web:22bdd5dba3bec152c1a81d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
