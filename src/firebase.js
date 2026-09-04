import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

/* =========================================================
   WEALTHORIA FIREBASE CONFIGURATION
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDYeZggBRJ1oP8r8yjuNMYYs5VSOX3yfnE",
  authDomain: "wealthoria-6fc11.firebaseapp.com",
  projectId: "wealthoria-6fc11",
  storageBucket: "wealthoria-6fc11.firebasestorage.app",
  messagingSenderId: "141910518023",
  appId: "1:141910518023:web:7198ed847f459cb71ebda2",
  measurementId: "G-Q9955KR0G6"
};

/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const app = firebase.app();

/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

/* =========================================================
   EXPOSE GLOBALS
   ---------------------------------------------------------
   Existing Wealthoria files use:
     window.firebase
     window.auth
     window.db
     window.storage
   ========================================================= */

window.firebase = firebase;
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;

/* =========================================================
   DEBUG
   ========================================================= */

console.log("Firebase initialized successfully");
console.log("Firebase App:", app);
console.log("Firebase Auth:", auth);
console.log("Firestore:", db);
console.log("Firebase Storage:", storage);

export {
  firebase,
  app,
  auth,
  db,
  storage
};

export default firebase;