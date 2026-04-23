import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyB1j5SlPmep_3fniy4ufwkpjy5pnmtdUtw",
  authDomain:        "community-passport-616ae.firebaseapp.com",
  projectId:         "community-passport-616ae",
  storageBucket:     "community-passport-616ae.firebasestorage.app",
  messagingSenderId: "154893165648",
  appId:             "1:154893165648:web:87e860302451b4e5955d55",
  measurementId:     "G-T9LCH98KB6",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
