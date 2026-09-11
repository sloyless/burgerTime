import { calculateScoreColor } from 'functions';

type Props = {
  score: number;
};

function ScoreBadge({ score }: Readonly<Props>) {
  const color = calculateScoreColor(score);

  return (
    <div className="w-[90px] shrink-0">
      <div
        className={`rounded-xl border border-white text-white ${color} box-shadow p-1 text-center`}
      >
        <strong className="text-[10px] tracking-wide uppercase">Score</strong>
        <br />
        <span className="text-4xl leading-5">{score}</span>
      </div>
    </div>
  );
}

export default ScoreBadge;
