import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
// Push notifications: same Firebase version as the rest of the app.
import "firebase/compat/messaging";

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
   GLOBALS
   ---------------------------------------------------------
   Only the Firebase SDK namespace stays on window, because
   public/firebase/notifications.js is a separately-loaded
   classic script that needs firebase.messaging().
   db / auth / storage are NOT exposed any more: import them
   from "./firebase.js" instead.
   ========================================================= */

window.firebase = firebase;

/* =========================================================
   DEBUG
   ========================================================= */


export {
  firebase,
  app,
  auth,
  db,
  storage
};

export default firebase;