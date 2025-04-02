import { User } from 'firebase/auth'

function HomePage({
  user,
  logout,
  note,
  setNote,
  saveNote,
  savedNote
}: {
  user: User
  logout: () => void
  note: string
  setNote: (n: string) => void
  saveNote: () => void
  savedNote: string
}) {
  return (
    <>
      <p>Welcome, {user.displayName}</p>
      <button onClick={logout}>Log out</button>

      <div style={{ marginTop: 20 }}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something..."
        />
        <button onClick={saveNote}>Save</button>
      </div>

      {savedNote && (
        <p style={{ marginTop: 10 }}>
          Last saved note: <strong>{savedNote}</strong>
        </p>
      )}
    </>
  )
}

export default HomePage