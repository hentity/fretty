import { Link } from 'react-router-dom'
import { HelpCircle, Menu } from 'lucide-react'
import { useAuth } from '../context/UserContext'

function Nav() {
  const user = useAuth().user
  return (
    <nav className="flex justify-between items-center px-4 py-3 text-black">
      {/* Left: Hamburger button */}
      {user ? 
      (<Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium"
        >
          Home Page
        </Link>): (
        <Link
            to="/auth"
            className="flex items-center gap-2 text-sm font-medium"
          >
            Sign in
        </Link>
      )}

      {/* Right: Help button */}
      <Link
        to="/help"
        className="flex items-center gap-1 text-sm font-medium"
      >
        <HelpCircle size={20} />
        Help
      </Link>
    </nav>
  )
}

export default Nav
