
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzAH6xzjb96fwX3yAnf1uGmnDPsYxbz4M",
  authDomain: "invondata.firebaseapp.com",
  projectId: "invondata",
  storageBucket: "invondata.appspot.com",
  messagingSenderId: "659381911637",
  appId: "1:659381911637:web:59ad2135df6c318ef754dc"
};

// Validate config
const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
] as const;

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing required Firebase configuration keys: ${missingKeys.join(', ')}. ` +
    `Please check your .env.local file or Vercel environment variables.`
  );
}


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { db, auth, storage };
