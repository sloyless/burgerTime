import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';

import BurgerRateField from 'components/BurgerRateField';

type Props = {
  children?: ReactNode;
  disabled?: boolean;
  na: boolean;
  onNAToggle: () => void;
  onChange?: (value: number) => void;
  value?: number;
};

function BurgerOptionalRateField({
  children,
  disabled = false,
  na,
  onNAToggle,
  onChange,
  value = 0,
}: Readonly<Props>) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={na ? 'Mark as applicable' : 'Not applicable'}
          aria-pressed={na}
          title={na ? 'Include in rating' : 'Not on this burger (N/A)'}
          disabled={disabled}
          onClick={onNAToggle}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
            na
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300 hover:text-stone-600'
          }`}
        >
          <FontAwesomeIcon icon={faBan} className="size-4" />
        </button>
        <div className={na ? 'opacity-50' : undefined}>
          <BurgerRateField
            disabled={disabled}
            value={value}
            onChange={onChange}
          />
        </div>
      </div>
      {children ? (
        <div className="mt-2 space-y-2 text-sm text-stone-500">{children}</div>
      ) : null}
    </div>
  );
}

export default BurgerOptionalRateField;
