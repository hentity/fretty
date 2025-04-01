import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyBl1ntmpU4mURrLCeThoJk2BTKAdMtew0s",
    authDomain: "fretty-70c12.firebaseapp.com",
    projectId: "fretty-70c12",
    storageBucket: "fretty-70c12.firebasestorage.app",
    messagingSenderId: "385005321325",
    appId: "1:385005321325:web:80add1a0796c3649531364"
};
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

export {auth, provider, db}
