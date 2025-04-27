import { TextBox } from '../../../components/TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';

function Fretboard() {
  const content = makeTextBlock([
    { text: "Fretboard", className: 'text-fg font-bold' }
  ]);

  return (
    <TextBox
      width={80}
      height={10}
      content={content}
    />
  );
}

export default Fretboard;
