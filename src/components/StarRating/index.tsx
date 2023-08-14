import { MouseEvent, ReactNode, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarReg } from '@fortawesome/free-regular-svg-icons';

type Props = {
  children: ReactNode;
  id: string;
  rating?: number;
  updateRating: (value: number) => any;
};

function StarRating({ children, id, rating = 0, updateRating }: Props) {
  const [currentValue, setCurrentValue] = useState<number>(rating);

  const count = 5;

  function rateHandler(e: MouseEvent<HTMLButtonElement>, nextValue: number) {
    e.preventDefault();
    setCurrentValue(nextValue);
    if (rating !== nextValue) updateRating(nextValue);
  }

  return (
    <div className="md:w-2/3">
      {Array(count)
        .fill(1)
        .map((value, i) => {
          const isActive = currentValue >= i + 1;
          const starIcon = isActive ? faStarSolid : faStarReg;
          const starColor = isActive ? 'text-orange-400' : 'text-white';

          return (
            <button
              key={i}
              onClick={(e) => rateHandler(e, i + 1)}
              role="button"
              title={`${i + 1} star${i > 0 ? 's' : ''}`}
              className={`${starColor} me-4 hover:text-orange-300`}
            >
              <FontAwesomeIcon icon={starIcon} size="2xl" />
            </button>
          );
        })}
      {children ? (
        <small className="mt-2 block pt-1 text-slate-600" id={`${id}Help`}>
          {children}
        </small>
      ) : null}
    </div>
  );
}

export default StarRating;
