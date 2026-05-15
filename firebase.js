import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNQHTCiO3f3XDhhv8Gb_Ciaw7TLTDFqgM",
  authDomain: "notebook-55cef.firebaseapp.com",
  projectId: "notebook-55cef",
  storageBucket: "notebook-55cef.firebasestorage.app",
  messagingSenderId: "221794373653",
  appId: "1:221794373653:web:2cbc8bdc42add26eff3e1c",
  measurementId: "G-EQ10QXYREG"
};

const app = initializeApp(firebaseConfig);

// Offline persistence: multi-tab IndexedDB cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
