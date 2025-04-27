import { TextBox } from "../components/TextBox";
import { makeTextBlock } from "../styling/stylingUtils";
import { useEffect, useState } from 'react';
import { ColoredChar } from "../types";

function TextTest() {
  const textOne = makeTextBlock([
    { text: "A single line", fgColor: 'var(--color-practiced)'},
  ]);
  const textTwo = makeTextBlock([
    { text: "Component two\n"},
    { text: "Second Line", bgColor: 'var(--color-mastered)', fgColor:'var(--color-bg)', onClick: () => console.log('Clicked!') },
  ]);

  const [content, setContent] = useState<ColoredChar[][]>([]);

  useEffect(() => {
    fetch('/test_note_art.txt')
      .then((res) => res.text())
      .then((text) => {
        const colored = makeTextBlock([
          { text: text, fgColor: 'var(--color-practiced)' }
        ]);
        setContent(colored);
      })
      .catch(console.error);
  }, []);

  if (content.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center">
      {/* First Row: two TextBoxes side by side */}
      <div className="flex flex-row justify-center hover:border hover:border-borderDebug">
        <TextBox width={30} height={6} content={content} />
        <TextBox width={30} height={6} content={textOne} />
      </div>

      {/* Second Row: one TextBox spanning under both */}
      <div className="flex justify-center hover:border hover:border-borderDebug">
        <TextBox width={60} height={4} content={textTwo}/>
      </div>
    </div>
  );
}

export default TextTest;
