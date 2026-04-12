// Scratch page for trying out button styles — not linked from nav

const mono = "font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl";
const sm = "keep practicing";
const lg = "start";

function Label({ children }: { children: string }) {
  return <span className="font-mono text-fg brightness-40 text-xs mb-1">{children}</span>;
}

export default function ButtonTest() {
  return (
    <div className={`${mono} flex flex-col items-center justify-center w-full h-full gap-6 text-fg overflow-y-auto py-8`}>

      {/* 1. Border, fill on hover */}
      <div className="flex flex-col items-center">
        <Label>border · fill on hover</Label>
        <button className={`${mono} text-fg border border-fg px-4 py-1 hover:bg-fg hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 2. Border, dim bg + fill on hover */}
      <div className="flex flex-col items-center">
        <Label>border · dim bg</Label>
        <button className={`${mono} text-fg border border-fg px-4 py-1 bg-grey-shimmer hover:bg-fg hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 3. Border, brightness hover only */}
      <div className="flex flex-col items-center">
        <Label>border · brightness hover</Label>
        <button className={`${mono} text-fg border border-fg px-4 py-1 hover:brightness-125 active:brightness-150 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 4. Dim border, brightens on hover */}
      <div className="flex flex-col items-center">
        <Label>dim border · brightens</Label>
        <button className={`${mono} text-fg brightness-50 border border-fg px-4 py-1 hover:brightness-100 active:brightness-125 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 5. Good colour border, fill on hover */}
      <div className="flex flex-col items-center">
        <Label>good border · fill on hover</Label>
        <button className={`${mono} text-good border border-good px-4 py-1 hover:bg-good hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 6. Good colour border, shimmer bg */}
      <div className="flex flex-col items-center">
        <Label>good border · dim bg</Label>
        <button className={`${mono} text-good border border-good px-4 py-1 bg-grey-shimmer hover:bg-good hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {sm}
        </button>
      </div>

      {/* 7. Large — border, fill on hover */}
      <div className="flex flex-col items-center">
        <Label>large · border · fill</Label>
        <button className={`${mono} text-fg border border-fg px-8 py-2 text-lg hover:bg-fg hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {lg}
        </button>
      </div>

      {/* 8. Large — good border, fill on hover */}
      <div className="flex flex-col items-center">
        <Label>large · good border · fill</Label>
        <button className={`${mono} text-good border border-good px-8 py-2 text-lg hover:bg-good hover:text-bg active:brightness-75 transition cursor-pointer`}>
          {lg}
        </button>
      </div>

      {/* 9. Large — dim border, brightens */}
      <div className="flex flex-col items-center">
        <Label>large · dim border · brightens</Label>
        <button className={`${mono} text-fg brightness-40 border border-fg px-8 py-2 text-lg hover:brightness-100 active:brightness-125 transition cursor-pointer`}>
          {lg}
        </button>
      </div>

    </div>
  );
}
