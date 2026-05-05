import { initializeApp } from "firebase/app";

const requiredEnvValues = [
  import.meta.env.VITE_FIREBASE_API_KEY,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  import.meta.env.VITE_FIREBASE_APP_ID,
];

export const firebaseConfigMissing = requiredEnvValues.some((value) => !value);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "local-demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fridge-memory-local.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fridge-memory-local",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fridge-memory-local.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:local",
};

export const firebaseApp = initializeApp(firebaseConfig);
