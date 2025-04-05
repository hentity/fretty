import { UserContext } from '../context/UserContext'
import { useContext } from 'react'

function Home() {
  const { user, loading } =useContext(UserContext)

  if (loading) return <p>Loading user...</p>

  return (
    <div>
      <h2>Home Page</h2>
      {user ? (
        <p>You're signed in as {user.displayName || user.email}</p>
      ) : (
        <p>You are not signed in.</p>
      )}
    </div>
  )
}

export default Home
