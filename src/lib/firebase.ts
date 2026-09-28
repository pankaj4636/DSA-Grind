import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your project's Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBepbROvqZW5oUuZepFxS7vNe5oEYWj90M",
  authDomain: "my-app-a14d1.firebaseapp.com",
  projectId: "my-app-a14d1",
  storageBucket: "my-app-a14d1.firebasestorage.app",
  messagingSenderId: "863565816565",
  appId: "1:863565816565:web:f843809e30516f07e65bbc",
  measurementId: "G-K4T17ER96V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Helper functions for easy login/logout
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithGithub = () => signInWithPopup(auth, githubProvider);
export const logoutUser = () => signOut(auth);
