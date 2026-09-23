import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "esoteric-healer-5f38q",
  appId: "1:565083189016:web:bd306af80076b09237f86d",
  apiKey: "AIzaSyCRPdKH0IwkAlp6p9ZTG4T1SvbsjprbONY",
  authDomain: "esoteric-healer-5f38q.firebaseapp.com",
  storageBucket: "esoteric-healer-5f38q.firebasestorage.app",
  messagingSenderId: "565083189016",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-fdabd514-fe84-4902-92ad-d8baae83c58a");
