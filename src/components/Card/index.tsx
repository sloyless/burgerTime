import Image from "next/legacy/image";
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

import {
  calculateScore,
  calculateScoreColor,
  calculateTimestamp,
  getFormattedDate,
} from 'functions';

import burgerholder from './assets/burgerholder.jpg';
import { DocumentData } from 'firebase/firestore';

type Props = {
  burger: DocumentData;
  url: string;
};

function Card({ burger, url }: Readonly<Props>) {
  if (!burger) return;
  const score = calculateScore(burger) || 100;
  const color = calculateScoreColor(burger.total || score);

  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();

  return (
    <Link
      className="box-shadow relative block overflow-hidden rounded-lg bg-orange-600 text-white"
      href={url}
    >
      <div className="flex h-full flex-row">
        <div className="relative w-1/3 bg-white">
          <Image src={burgerholder} alt="Burger" fill />
        </div>
        <div className="relative w-2/3 p-3 pb-[95px]">
          <h2 className="text-2xl">{burger.venue}</h2>
          <hr className="my-1 w-full" />
          <div className="line-clamp-1 text-xs">
            <FontAwesomeIcon
              icon={faGlobe}
              size="sm"
              className="mx-auto me-1 inline-block w-[12px] align-bottom"
            />{' '}
            {burger.address}
          </div>
          <div className="absolute bottom-3 mt-4 flex h-[95px] w-full flex-row items-end pe-5">
            <div className="w-2/3">
              <p className="mb-1 line-clamp-2 pe-4 text-sm italic">
                {burger.burgerName}
              </p>
              <span className="text-xs">
                <time dateTime={timestampISO}>
                  {timestampDate && getFormattedDate(timestampDate)}
                </time>
              </span>
            </div>
            <div
              className={`w-1/3 rounded-xl border border-white ${color} box-shadow p-1 text-center `}
            >
              <strong className="text-[10px] uppercase tracking-widest">
                Score
              </strong>
              <br />
              <span className="text-3xl">{score}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default Card;
