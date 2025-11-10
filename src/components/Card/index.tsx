import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faStar } from '@fortawesome/free-solid-svg-icons';

import {
  calculateScore,
  calculateScoreColor,
  calculateTimestamp,
  getFormattedDate,
} from 'functions';

import burgerholder from './assets/newburger.jpg';
import { DocumentData } from 'firebase/firestore';
import LocationLink from 'components/LocationLink';

type Props = {
  burger: DocumentData;
  featured?: boolean;
  url: string;
};

function Card({ burger, featured = false, url }: Readonly<Props>) {
  if (!burger) return;
  const score = calculateScore(burger) || 100;
  const color = calculateScoreColor(burger.total || score);

  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();
  const googleMapsUrl = encodeURIComponent(
    `${burger.venue}, ${burger.address}`
  );

  return (
    <article className="relative lg:my-5">
      <div className={!featured ? 'lg:flex lg:flex-row' : ''}>
        {burger.image && (
          <Link
            className={`relative bg-white ${!featured ? 'lg:flex-1 lg:pr-5' : 'h-[300px] w-full'}`}
            href={url}
            title={`${burger.burgerName} at ${burger.venue}`}
          >
            <Image
              src={burger.image}
              alt={burger.burgerName}
              width={500}
              height={300}
              style={{
                width: '100%',
                height: 'auto',
              }}
            />
          </Link>
        )}
        <div className={!featured ? 'mt-3 lg:mt-0 lg:flex-2' : 'mt-3'}>
          <div className="flex flex-row">
            <div className="flex-1 pr-5">
              <div className="flex flex-row items-end justify-between">
                <Link
                  className="text-orange-600 hover:text-orange-500"
                  href={`/burger/${burger.id}`}
                >
                  <h3
                    className={`${featured ? 'text-3xl' : 'text-2xl'} font-bold`}
                  >
                    {burger.venue}
                    {burger.total > 94 && (
                      <span className="inline-block pb-2 pl-1">
                        <FontAwesomeIcon
                          icon={faStar}
                          size="sm"
                          className="w-[12px] text-amber-500"
                        />
                      </span>
                    )}
                  </h3>
                </Link>
                <span className="hidden pb-1 pl-3 text-xs lg:block">
                  <time dateTime={timestampISO}>
                    {timestampDate && getFormattedDate(timestampDate)}
                  </time>
                </span>
              </div>
              <hr className="my-1 w-full" />
              <LocationLink burger={burger} />
            </div>
            <div className="w-[90px]">
              <div
                className={`rounded-xl border border-white text-white ${color} box-shadow p-1 text-center`}
              >
                <strong className="text-[10px] uppercase tracking-wide">
                  Score
                </strong>
                <br />
                <span className="text-4xl leading-5">
                  {calculateScore(burger)}
                </span>
              </div>
            </div>
          </div>
          <div
            className={`mt-3 line-clamp-2 inline-block ${featured ? 'text-lg' : 'text-sm'}`}
          >
            <span className="font-bold italic">{burger.burgerName}</span>
            {burger?.notes && <span>: {burger.notes}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default Card;
