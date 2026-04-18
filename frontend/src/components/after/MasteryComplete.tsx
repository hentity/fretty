import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const MONO = 'font-mono text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl';

type Props = {
  onDismiss: () => void;
};

export default function MasteryComplete({ onDismiss }: Props) {
  useEffect(() => {
    const end = Date.now() + 3000;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#5498ab', '#6a994e', '#fefae0'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#5498ab', '#6a994e', '#fefae0'],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90">
      <div className={`${MONO} flex flex-col items-center gap-6 outline outline-2 outline-fg bg-bg px-10 py-10 max-w-sm mx-4`}>
        <span className="text-fg font-bold text-center">ALL DONE!</span>
        <div className="flex flex-col items-center gap-3">
          <span className="text-fg/70 text-center">You've mastered every note on the fretboard!</span>
          <span className="text-fg/50 text-center">Fretty will schedule reviews every now and then to keep things fresh.</span>
        </div>
        <button
          onClick={onDismiss}
          className="bg-fg text-bg font-bold px-8 py-1 hover:brightness-75 active:brightness-60 transition cursor-pointer"
        >
          OK
        </button>
      </div>
    </div>
  );
}
