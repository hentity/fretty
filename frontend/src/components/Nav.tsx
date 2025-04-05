import { Link } from 'react-router-dom'
import { HelpCircle, Menu } from 'lucide-react'

function Nav() {
  return (
    <nav className="flex justify-between items-center px-4 py-3 text-black bg-gray-200">
      {/* Left: Hamburger button */}
      <Link
        to="/"
        className="flex items-center gap-2 text-sm font-medium hover:text-stone-700"
      >
        Sign in
      </Link>

      {/* Right: Help button */}
      <Link
        to="/help"
        className="flex items-center gap-1 text-sm font-medium hover:text-stone-700"
      >
        <HelpCircle size={20} />
        Help
      </Link>
    </nav>
  )
}

export default Nav
