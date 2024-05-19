import type { NextPage } from 'next';

const BurgerRules: NextPage = () => {
  return (
    <aside className="w-full bg-slate-500 p-4 text-white md:w-[320px]">
      <h2 className="mb-3 text-xl">How does the scoring work?</h2>
      <ul>
        <li className="mb-3 flex gap-1">
          <div className="h-[40px] w-[60px] bg-green-900 py-3 text-center text-xs text-white">
            95-100
          </div>
          <span className="ms-1 w-2/3 text-xs leading-none">
            I could eat this burger every day for the rest of my life.
          </span>
        </li>
        <li className="mb-3 flex gap-1">
          <div className="h-[40px] w-[60px] bg-green-600 py-3 text-center text-xs text-white">
            80-95
          </div>
          <span className="ms-1 w-2/3 text-xs leading-none">
            This is, excuse me, a damn fine burger.
          </span>
        </li>
        <li className="mb-3 flex gap-1">
          <div className="h-[40px] w-[60px] bg-yellow-500 py-3 text-center text-xs text-white">
            50-80
          </div>
          <span className="ms-1 w-2/3 text-xs leading-none">
            This is a decent burger.
          </span>
        </li>
        <li className="mb-3 flex gap-1">
          <div className="h-[40px] w-[60px] bg-orange-500 py-3 text-center text-xs text-white">
            20-50
          </div>
          <span className="ms-1 w-2/3 text-xs leading-none">
            I&apos;m glad I ate this once so I know I never have to eat it
            again.
          </span>
        </li>
        <li className="mb-3 flex gap-1">
          <div className="h-[40px] w-[60px] bg-red-900 py-3 text-center text-xs text-white">
            &lt; 20
          </div>
          <span className="ms-1 w-2/3 text-xs leading-none">
            Send this garbage back to the nightmare it came from.
          </span>
        </li>
      </ul>
      <hr />
      <h3 className="my-3 text-lg">Score Breakdown</h3>
      <strong>Appearance</strong>
      <p className="mb-3 text-sm">Max score: 5pts</p>
      <strong>Bun</strong>
      <p className="mb-3 text-sm">Max score: 15pts</p>
      <strong>Meat</strong>
      <p className="mb-3 text-sm">Max score: 30pts</p>
      <strong>Cheese</strong>
      <p className="mb-3 text-sm">Max score: 25pts</p>
      <strong>Vegetables</strong>
      <p className="mb-3 text-sm">Max score: 15pts</p>
      <strong>Sauces</strong>
      <p className="mb-3 text-sm">Max score: 15pts</p>
    </aside>
  );
};

export default BurgerRules;
