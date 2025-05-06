import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createDefaultProgress } from '../logic/progressUtils';
import { useAuth } from '../context/UserContext';
import { ColoredChunk, Progress } from '../types';
import { TextBox } from '../components/TextBox';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeTextBlock } from '../styling/stylingUtils';

export const LOCAL_STORAGE_KEY = 'fretty_guest_progress';

async function createProgressIfMissing(uid: string) {
  const ref = doc(db, 'progress', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    try {
      const progress = localData ? JSON.parse(localData) as Progress : createDefaultProgress();
      await setDoc(ref, progress);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to parse guest progress from localStorage:', err);
      await setDoc(ref, createDefaultProgress());
    }
  }
}

export default function Auth() {
  const { user, loading } = useAuth();
  const [content, setContent] = useState<ColoredChunk[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      setContent([
        { text: 'You are already signed in. Redirecting...\n', className: 'text-fg' },
      ]);
      setTimeout(() => navigate('/'), 2000);
      return;
    }

  }, [user, loading, navigate]);

  const handleEmailPasswordLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, username, password);
      const loggedInUser = result.user;
      await createProgressIfMissing(loggedInUser.uid);
      window.location.href = '/';
    } catch (err) {
      console.error('Email/password login error:', err);
      setAlert(true);
      setContent([
        { text: 'Email/password login failed. Check credentials.\n', className: 'text-hard' },
      ]);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, username, password);
      const newUser = result.user;
      await createProgressIfMissing(newUser.uid);
      window.location.href = '/';
    } catch (err) {
      console.error('Account creation error:', err);
      setAlert(true);
      setContent([
        { text: 'Account creation failed. Email may already be in use or password is too weak.\n', className: 'text-hard' },
      ]);
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center w-full h-full font-mono gap-4">
      {alert &&(<TextBox
        width={80}
        height={2}
        content={content}
      />)}
      {!createAccount && (
        <div className='pl-3 flex gap-3'>
        <TextBox
          width={36}
          height={2}
          content={makeTextBlock([
            { text: '[ sign in with google ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
              onClick: async () => {
                try {
                  const result = await signInWithPopup(auth, googleProvider);
                  const loggedInUser = result.user;
                  await createProgressIfMissing(loggedInUser.uid);
                  window.location.href = '/';
                } catch (err) {
                  console.error('Google login error:', err);
                  setAlert(true);
                  setContent([
                    { text: 'Google login failed. Please try again.\n', className: 'text-hard' },
                  ]);
                }
              }},
          ])}
        />
        <TextBox
          width={36}
          height={1}
          content={makeTextBlock([
            { text: '[ Create Account ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
              onClick: () => {
                setCreateAccount(true);
                setAlert(true)
                setContent([
                  { text: 'Create an account to save your progress.\n', className: 'text-fg' },
                ]);
              }
             },
          ])}
        />
      </div>)}
      
      <input
        type="text"
        placeholder="Email"
        className="w-62 text-white text-xl text-center border border-fg rounded-md py-1 hover:text-fg"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="py-1 w-62 text-white text-xl text-center border border-fg rounded-md"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
        {createAccount === true ? 
        (
          <div className='pl-3 flex '>
            <TextBox
                width={20}
                height={1}
                content={makeTextBlock([
                  {
                    text: '[ create account ]',
                    className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
                    onClick: handleCreateAccount,
                  },
                ])}
              />
            <TextBox
                width={20}
                height={1}
                content={makeTextBlock([
                  {
                    text: '[    sign in    ]',
                    className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
                    onClick: () =>{
                      setCreateAccount(false);
                      setAlert(false);
                    },
                  },
                ])}
              />
          </div>
        ) : 
        (
          <div className='pl-3'>
            <TextBox
              width={36}
              height={1}
              content={makeTextBlock([
                {
                  text: '[ sign in ]',
                  className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold cursor-pointer transition',
                  onClick: handleEmailPasswordLogin,
                },
              ])}
            />
          </div>
        )}
    </div>
  );
}
