import { useEffect, useState } from 'react';
import { TextBox } from './TextBox';

export default function Countdown({ seconds = 3, onDone }: { seconds?: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const timeout = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining, onDone]);

  return (
    <TextBox
      width={20}
      height={2}
      content={[{ text: `Starting in ${remaining}...`, className: 'text-fg' }]}
    />
  );
}
