import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faStar as faStarSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarReg } from '@fortawesome/free-regular-svg-icons';
import { v4 as uuidv4 } from 'uuid';

type Props = {
  children: ReactNode;
  id: string;
  isEdit?: boolean;
  isValue?: boolean;
  rating?: number;
  updateRating?: (value: number) => unknown;
};

function StarRating({
  children,
  id,
  isEdit,
  isValue,
  rating = 0,
  updateRating,
}: Readonly<Props>) {
  const [currentValue, setCurrentValue] = useState<number>(0);

  useEffect(() => {
    if (rating > 0) {
      setCurrentValue(rating);
    }
  }, [rating]);

  const count = 5;

  function rateHandler(e: MouseEvent<HTMLButtonElement>, nextValue: number) {
    e.preventDefault();
    setCurrentValue(nextValue);
    if (typeof updateRating === 'function' && rating !== nextValue)
      updateRating(nextValue);
  }

  return (
    <div className="py-2">
      {Array(count)
        .fill(1)
        .map((_value, i) => {
          const isActive = currentValue >= i + 1;
          const starIcon = isActive ? faStarSolid : faStarReg;
          const starColor = isActive ? 'text-orange-400' : 'text-white';

          return (
            <button
              key={uuidv4()}
              onClick={(e) => rateHandler(e, i + 1)}
              title={`${i + 1} star${i > 0 ? 's' : ''}`}
              className={`${starColor} me-4 w-[25px] ${isEdit ? 'hover:text-orange-300' : ''}`}
              disabled={!updateRating}
            >
              <FontAwesomeIcon
                icon={isValue ? faDollarSign : starIcon}
                size="xl"
                fixedWidth
              />
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
