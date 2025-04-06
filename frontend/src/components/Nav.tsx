import { Link } from 'react-router-dom'
import { HelpCircle, Menu } from 'lucide-react'

function Nav() {
  return (
    <nav className="flex justify-between items-center px-4 py-3 text-black">
      {/* Left: Hamburger button */}
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-medium"
      >
        Sign in
      </Link>

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
