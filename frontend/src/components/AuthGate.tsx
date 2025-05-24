import { useAuth } from '../context/UserContext';
import { TextBox } from '../components/TextBox';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <TextBox width={30} height={3} content={[{ text: 'loading...', className: 'text-fg' }]} />
      </div>
    );
  }

  return <>{children}</>;
}
