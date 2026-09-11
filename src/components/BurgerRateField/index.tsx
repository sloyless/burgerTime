import { ReactNode } from 'react';
import { Rate } from 'antd';

type Props = {
  children?: ReactNode;
  disabled?: boolean;
  isValue?: boolean;
  onChange?: (value: number) => void;
  value?: number;
};

function BurgerRateField({
  children,
  disabled = false,
  isValue = false,
  onChange,
  value = 0,
}: Readonly<Props>) {
  return (
    <div>
      <Rate
        disabled={disabled}
        value={value}
        onChange={onChange}
        character={isValue ? '$' : undefined}
        className="text-brand-600"
      />
      {children ? (
        <div className="mt-2 space-y-2 text-sm text-stone-500">{children}</div>
      ) : null}
    </div>
  );
}

export default BurgerRateField;
