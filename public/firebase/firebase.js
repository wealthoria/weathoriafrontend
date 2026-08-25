const firebaseConfig = {

  apiKey: "AIzaSyDYeZggBRJ1oP8r8yjuNMYYs5VSOX3yfnE",

  authDomain: "wealthoria-6fc11.firebaseapp.com",

  projectId: "wealthoria-6fc11",

  storageBucket: "wealthoria-6fc11.firebasestorage.app",

  messagingSenderId: "141910518023",

  appId: "1:141910518023:web:7198ed847f459cb71ebda2",

  measurementId: "G-Q9955KR0G6"

};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}


window.firebase = firebase;

window.auth = firebase.auth();

window.db = firebase.firestore();

window.storage = firebase.storage();

console.log("Firebase initialized");

console.log("Firebase Auth:", window.auth);

console.log("Firestore:", window.db);

console.log("Firebase Storage:", window.storage);