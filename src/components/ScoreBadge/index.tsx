import { calculateScoreColor } from 'functions';

type Props = {
  compact?: boolean;
  score: number;
};

function ScoreBadge({ compact = false, score }: Readonly<Props>) {
  const color = calculateScoreColor(score);

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-white px-2 py-1 text-center text-white ${color} box-shadow`}
      >
        <span className="text-lg leading-none font-bold tabular-nums">
          {score}
        </span>
      </div>
    );
  }

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
