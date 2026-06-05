import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA7KiIkVIGuDxD9JAZwCAEKgriRZRXNX_I",
  authDomain: "pocket-envelopes.firebaseapp.com",
  databaseURL: "https://pocket-envelopes-default-rtdb.firebaseio.com",
  projectId: "pocket-envelopes",
  storageBucket: "pocket-envelopes.firebasestorage.app",
  messagingSenderId: "23167808538",
  appId: "1:23167808538:web:33c2ff7b25e97f9c834da3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
