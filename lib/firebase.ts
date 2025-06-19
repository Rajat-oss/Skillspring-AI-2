import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQsj-6ggimudf8b5IQjN8V33zaRqfoJLw",
  authDomain: "skillbring-45956.firebaseapp.com",
  projectId: "skillbring-45956",
  storageBucket: "skillbring-45956.firebasestorage.app",
  messagingSenderId: "219696817947",
  appId: "1:219696817947:web:9654a35dfff3e6eec5d5be",
  measurementId: "G-L7SHECFHCM"
};

// Initialize Firebase app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

async function signup(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function logout() {
  return signOut(auth);
}

function onAuthStateChangedListener(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export {
  auth,
  signup,
  login,
  logout,
  onAuthStateChangedListener,
  FirebaseUser,
};
