# Fretty

A guitar fretboard learning app using spaced repetition. Users are shown a note name and must find/play it on the fretboard before a 5-second timer expires. Built as a React web app deployed as a static site and as iOS/Android apps via Capacitor.

Currently in beta on TestFlight.

## Stack

- **React 19 + TypeScript + Vite** — frontend
- **Tailwind CSS 4** — styling
- **Firebase** (Firestore + Google Auth) — persistence and auth for web users
- **Capacitor 7** — iOS/Android native wrapper
- **Rust + WASM** — real-time microphone pitch detection

## Key Architecture

### UI Style
The app uses a deliberate text/terminal aesthetic. All game screens are composed using `TextBox` and `TextContainer` — ASCII-art-style layouts built from `ColoredChunk[]` arrays (see [frontend/src/components/TextBox.tsx](frontend/src/components/TextBox.tsx) and [frontend/src/types.ts](frontend/src/types.ts)). Keep new UI consistent with this approach.

### Lesson Flow
Three phases managed via `LessonContext` (`lessonStatus: 'before' | 'during' | 'after'`):
- **Before** — intro / lesson start
- **During** — fretboard + timer + note panel
- **After** — completion screen

State lives in [frontend/src/context/LessonProvider.tsx](frontend/src/context/LessonProvider.tsx).

### Spaced Repetition
Implemented in [frontend/src/logic/lessonUtils.ts](frontend/src/logic/lessonUtils.ts). Uses an SM-2-style algorithm:
- Each note (spot = string + fret) has `ease_factor`, `interval`, `good_attempts`, `status`
- Learning phase: needs 3 consecutive good/easy responses to graduate to review
- Review phase: interval grows by ease factor each cycle
- Mastered threshold: `interval >= 14` days
- Max 5 new notes per day; reviews distributed to avoid overloading future days

### Audio / WASM
The [wasm/](wasm/) folder contains Rust crates compiled to WASM:
- `audio_utils` — FFT utilities and `fundamental_frequency()` / `frequency_to_note()`
- `audio_processing` — exports `detect_note(samples, sample_rate)` to JS

The compiled output lives in [frontend/src/wasm/](frontend/src/wasm/). To rebuild after Rust changes, run the build script from the wasm directory and copy the output.

Integration: [frontend/src/components/TimerBar.tsx](frontend/src/components/TimerBar.tsx) runs an AudioWorklet ([frontend/public/worklet-processor.js](frontend/public/worklet-processor.js)) that streams 128-sample chunks from the mic. Every 100ms, a 500ms rolling buffer is passed to WASM for note detection. Adaptive noise gating suppresses ambient noise.

### Data Persistence
Progress is stored in three places depending on context:

| Context | Storage |
|---|---|
| Web, signed in | Firestore (`progress/{uid}`) |
| Web, guest | localStorage (`fretty_guest_progress`) |
| Native (iOS/Android) | Capacitor Preferences |

Guest web progress migrates to Firestore on sign-in. Native apps have no Firebase auth — always local.

Progress shape is defined in [frontend/src/logic/progressUtils.ts](frontend/src/logic/progressUtils.ts). Spot key format: `"${string}-${fret}"` (e.g. `"0-5"`).

### Platform Differences
- **Web:** Firebase auth (Google), localStorage fallback
- **Native:** No auth, Capacitor Preferences, push notifications via `@capacitor/local-notifications`
- Use `Capacitor.isNativePlatform()` to branch behavior

### Notes / Fretboard
- 6 strings × 12 frets = 72 spots
- Only natural notes are taught; sharps/flats are `status: 'unlearnable'`
- Tuning is configurable (default standard); changing tuning resets spot-to-note mappings
- Note utilities: [frontend/src/logic/noteUtils.ts](frontend/src/logic/noteUtils.ts)

## Directory Layout

```
fretty/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (TextBox, Fretboard, TimerBar, Nav, ...)
│   │   ├── context/       # LessonContext, UserContext
│   │   ├── pages/         # Home, Auth, Profile, Help, Options
│   │   ├── logic/         # lessonUtils, noteUtils, progressUtils, reminderUtils
│   │   ├── hooks/         # useProgress
│   │   ├── wasm/          # Compiled WASM binaries + type defs
│   │   ├── styling/       # Color/text utilities
│   │   └── types.ts       # ColoredChunk and other shared types
│   ├── public/
│   │   └── worklet-processor.js  # AudioWorklet (runs on audio thread)
│   ├── ios/               # Capacitor iOS project
│   ├── android/           # Capacitor Android project
│   ├── capacitor.config.ts
│   ├── vite.config.ts
│   └── package.json
├── wasm/
│   ├── audio_processing/  # Main WASM crate
│   └── audio_utils/       # Shared FFT utilities
└── rsc/samples/           # Audio sample files for testing
```

## Common Tasks

```bash
# Frontend dev server
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Sync to native (after build)
cd frontend && npx cap sync

# Open iOS project
cd frontend && npx cap open ios
```

## Things to Know

- The app ID is `org.fretty.app`
- Scoring: easy (<1.5s), good (<3s), hard (<5s), fail (timeout)
- First-ever lesson uses a 6-note hardcoded tutorial with no timer
- The timer bar / J+K+L keyboard shortcut are the non-audio fallback for answering
- `--vh` CSS variable is set dynamically in App.tsx to fix mobile Safari viewport height
- Dark mode follows the system preference (`dark` Tailwind class via `prefers-color-scheme`)
