import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { Burger } from 'utils/types';

type Props = {
  burger: Burger;
};

function LocationLink({ burger }: Readonly<Props>) {
  const googleMapsUrl =
    burger && encodeURIComponent(`${burger.venue}, ${burger.address}`);

  return (
    <Link
      className="line-clamp-1 font-sans text-sm text-stone-600 hover:text-brand-700"
      href={`https://www.google.com/maps/search/?api=1&query=${googleMapsUrl}`}
      target="_blank"
      rel="nofollow"
    >
      <div className="flex min-w-0 items-center">
        <FontAwesomeIcon icon={faGlobe} size="sm" className="me-1 w-3 shrink-0" />
        <span className="truncate">{burger.address}</span>
      </div>
    </Link>
  );
}

export default LocationLink;
