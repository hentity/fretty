import { TextBox } from "../components/TextBox";
import { makeTextBlock } from "../styling/stylingUtils";
import { useEffect, useState } from 'react';
import { ColoredChar } from "../types";

function TextTest() {
  const textOne = makeTextBlock([
    { text: "A single line", fgColor: 'var(--color-blue)' },
  ]);
  const textTwo = makeTextBlock([
    { text: "Component two\n", bgColor: 'var(--color-blue)', fgColor:'var(--color-textLight)' },
    { text: "Second Line", bgColor: 'var(--color-magenta)', fgColor:'var(--color-textLight)' },
  ]);

  const [content, setContent] = useState<ColoredChar[][]>([]);

  useEffect(() => {
    fetch('/test_note_art.txt')
      .then((res) => res.text())
      .then((text) => {
        const colored = makeTextBlock([
          { text: text, fgColor: 'var(--color-green)' }
        ]);
        setContent(colored);
      })
      .catch(console.error);
  }, []);

  if (content.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center">
      {/* First Row: two TextBoxes side by side */}
      <div className="flex flex-row justify-center">
        <TextBox width={30} height={6} content={content} border={false} />
        <TextBox width={30} height={6} content={textOne} border={false} />
      </div>

      {/* Second Row: one TextBox spanning under both */}
      <div className="flex justify-center">
        <TextBox width={60} height={4} content={textTwo} border={false} />
      </div>
    </div>
  );
}

export default TextTest;
