import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBujtAw2Gu_0VseYwhMxpP6EcMRsnhZdDY",
  authDomain: "metro-7db04.firebaseapp.com",
  projectId: "metro-7db04",
  storageBucket: "metro-7db04.firebasestorage.app",
  messagingSenderId: "310496803696",
  appId: "1:310496803696:web:01f55caf950b0a860eadb5",
  measurementId: "G-38162TG413"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
