import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createDefaultProgress } from '../logic/progressUtils';
import { useAuth } from '../context/UserContext';
import { Progress } from '../types';

const LOCAL_STORAGE_KEY = 'guest_progress';

// Helper to create progress if missing after login
async function createProgressIfMissing(uid: string) {
  const ref = doc(db, 'progress', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.log('No existing progress found for user.');

    // Try to upload guest progress first
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (localData) {
      try {
        const guestProgress = JSON.parse(localData) as Progress;
        console.log('Uploading guest progress to Firestore:', guestProgress);
        await setDoc(ref, guestProgress);

        // Optionally clear guest progress from localStorage after upload
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to parse guest progress. Falling back to default progress.', err);
        const defaultProgress = createDefaultProgress();
        await setDoc(ref, defaultProgress);
      }
    } else {
      console.log('No guest progress found. Creating default progress.');
      const defaultProgress = createDefaultProgress();
      await setDoc(ref, defaultProgress);
    }
  } else {
    console.log('User already has existing progress:', snap.data());
  }
}

function Auth() {
  const { user } = useAuth();

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      await createProgressIfMissing(loggedInUser.uid);

      // Optional: Refresh page or reload app state if needed after login
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <h2 className="text-xl font-bold mb-4">Auth Page</h2>
      {user ? (
        <>
          <p className="mb-2">Signed in as: {user.email}</p>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="mb-2">No user signed in</p>
          <button
            onClick={login}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}

export default Auth;
