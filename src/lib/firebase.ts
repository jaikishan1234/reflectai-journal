import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, onSnapshot, getDoc } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with configured database ID
const customDbId = (firebaseConfigData as any).firestoreDatabaseId;
export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(app, customDbId)
  : getFirestore(app);

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc
};
