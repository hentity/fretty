import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createDefaultProgress } from '../logic/progressUtils';
import { useAuth } from '../context/UserContext';
import { ColoredChunk, Progress } from '../types';
import { TextBox } from '../components/TextBox';
import { useEffect, useState } from 'react';

export const LOCAL_STORAGE_KEY = 'fretty_guest_progress';

async function createProgressIfMissing(uid: string) {
  const ref = doc(db, 'progress', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (localData) {
      try {
        const guestProgress = JSON.parse(localData) as Progress;
        await setDoc(ref, guestProgress);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to parse guest progress from localStorage:', err);
        const defaultProgress = createDefaultProgress();
        await setDoc(ref, defaultProgress);
      }
    } else {
      const defaultProgress = createDefaultProgress();
      await setDoc(ref, defaultProgress);
    }
  }
}

export default function Auth() {
  const { user, loading } = useAuth();
  const [content, setContent] = useState<ColoredChunk[]>([]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      setContent([
        { text: 'You are already signed in. Redirecting...\n', className: 'text-fg' },
      ]);
      return;
    }

    const loginText = [
      {
        text: '[ sign in with google ]',
        className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
        onClick: async () => {
          try {
            const result = await signInWithPopup(auth, googleProvider);
            const loggedInUser = result.user;
            await createProgressIfMissing(loggedInUser.uid);
            window.location.href = '/'; // Redirect manually after login
          } catch (err) {
            console.error('Login error:', err);
            setContent([
              { text: 'Login failed. Please try again.\n', className: 'text-hard' },
            ]);
          }
        }
      },
    ];

    setContent(loginText);
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6">
      <TextBox
        width={80}
        height={10}
        content={content}
      />
    </div>
  );
}
