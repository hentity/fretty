export default function Privacy() {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 font-mono text-sm text-fg space-y-6">
        <h1 className="text-xl font-bold">Privacy Policy</h1>
        <p className="text-fg/50">Last updated: April 2026</p>

        <p>
          Fretty is a guitar fretboard learning app. This policy explains what data
          is collected, how it is used, and your rights as a user.
        </p>

        <section className="space-y-2">
          <h2 className="font-bold">Microphone</h2>
          <p className="text-fg/70">
            Fretty requests access to your microphone to detect notes played on
            your guitar in real time. Audio is processed entirely on your device
            using WebAssembly — it is never recorded, stored, or transmitted
            anywhere.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Data storage</h2>
          <p className="text-fg/70">
            On iOS and Android, all app data (your lesson progress, settings, and
            preferences) is stored locally on your device using device storage. No
            data is sent to any server.
          </p>
          <p className="text-fg/70">
            On the web version, users may optionally sign in with Google. If signed
            in, lesson progress is synced to Firebase (Google) to allow access
            across devices. Guest users on the web have their data stored in browser
            local storage only.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Third-party services</h2>
          <p className="text-fg/70">
            The web version uses Firebase (provided by Google) for authentication
            and data storage for signed-in users. Firebase's privacy policy can be
            found at{' '}
            <a
              href="https://firebase.google.com/support/privacy"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              firebase.google.com/support/privacy
            </a>
            . The iOS and Android apps do not use Firebase or any third-party
            services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Advertising and tracking</h2>
          <p className="text-fg/70">
            Fretty contains no advertising and does not track users for any purpose.
            No data is sold or shared with third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Children</h2>
          <p className="text-fg/70">
            Fretty does not knowingly collect any personal information from children
            under 13.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">Contact</h2>
          <p className="text-fg/70">
            If you have any questions about this policy, please open an issue at{' '}
            <a
              href="https://github.com/hentity/fretty"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/hentity/fretty
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
