import { signOut } from 'firebase/auth';
import { auth} from '../firebase';
import { useAuth } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();

    const { user } = useAuth();
    const logout = async () => {
        try {
            await signOut(auth);
            console.log('User signed out successfully.');
            navigate('/'); // Redirect to home page after sign out
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (!user) {
        return <Navigate to="/auth" />; // Redirect to auth page if not logged in
    }
    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-6">
        <h2 className="text-xl font-bold mb-4">Auth Page</h2>
            <p className="mb-2">Signed in as: {user.email}</p>
            <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
                Sign out
            </button>
        </div>
    )
}

export default Profile