function LandingPage({ login }: { login: () => void }) {
    return (
      <div>
        <h2>Welcome to the App</h2>
        <button onClick={login}>Sign in with Google</button>
      </div>
    )
  }
  
  export default LandingPage