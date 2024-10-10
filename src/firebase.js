import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'; // Import Firestore instead of Database
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app); 
const auth = getAuth(app);

export { database, auth };
