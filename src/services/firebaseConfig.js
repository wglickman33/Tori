import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBP3Kq2zKadnVLaO58mfNPJki3ad0Vq93k",
  authDomain: "tori-45a73.firebaseapp.com",
  projectId: "tori-45a73",
  storageBucket: "tori-45a73.appspot.com",
  messagingSenderId: "537327176741",
  appId: "1:537327176741:web:191d6bf5dfcbc43422c3cc",
  databaseURL: "https://tori-45a73-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };