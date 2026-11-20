// firebase.ts – Firebase SDK initialization (modular SDK)
// -------------------------------------------------
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace the values below with your actual Firebase project config
// (Values are already provided – keep them secret in production)
const firebaseConfig = {
  apiKey: "AIzaSyDdwjqlZTjF5P51xazddyvU9CAt3nfpLaE",
  authDomain: "prohori-ai.firebaseapp.com",
  projectId: "prohori-ai",
  storageBucket: "prohori-ai.firebasestorage.app",
  messagingSenderId: "922626279691",
  appId: "1:922626279691:web:669e0e67f371564d27ba0e",
  measurementId: "G-72MJLZ0W70"
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional – works only on supported browsers)
export const analytics = getAnalytics(app);

export default app;
// -------------------------------------------------
