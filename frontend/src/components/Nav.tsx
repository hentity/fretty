import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { useAuth } from '../context/UserContext'
import useProgress from '../hooks/useProgress'

const MASTERED_THRESHOLD = 5  // how many practices needed to be "mastered"

function Nav() {
  const { user } = useAuth()
  const { progress } = useProgress(user)

  // defaults if no progress loaded yet
  let practicingCount = 0
  let masteredCount = 0
  let unpracticedCount = 0

  if (progress) {
    progress.spots.forEach(spot => {
      if (!(spot.status === 'unlearnable')) {
        if (spot.num_practices >= MASTERED_THRESHOLD) {
          masteredCount++
        } else if (spot.num_practices > 0) {
          practicingCount++
        } else {
          unpracticedCount++
        }
      }
    })
  }

  return (
    <nav className="flex justify-between items-center px-4 py-3 text-black">
      {/* Left: Home or Sign in link */}
      {user ? (
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium"
        >
          Home
        </Link>
      ) : (
        <Link
          to="/auth"
          className="flex items-center gap-2 text-sm font-medium"
        >
          Sign in
        </Link>
      )}

      {/* Middle: Spot counts */}
      {user && (
        <div className="flex gap-4 text-sm font-medium">
          <span>Practicing: {practicingCount}</span>
          <span>Mastered: {masteredCount}</span>
          <span>Unpracticed: {unpracticedCount}</span>
        </div>
      )}

      {/* Right: Help link */}
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
