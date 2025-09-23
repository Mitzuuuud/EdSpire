// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "<YOUR>",
  authDomain: "<YOUR>",
  projectId: "<YOUR>",
  storageBucket: "<YOUR>",
  messagingSenderId: "<YOUR>",
  appId: "<YOUR>",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
