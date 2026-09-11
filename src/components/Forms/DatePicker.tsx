import { ChangeEventHandler, ReactNode } from 'react';

type Props = {
  children?: ReactNode;
  disabled?: boolean;
  id: string;
  inputClassName?: string;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
  wrapperClassName?: string;
};

function DatePicker({
  children,
  disabled,
  id,
  inputClassName,
  max,
  min,
  onChange,
  required,
  value,
  wrapperClassName = 'w-full',
}: Readonly<Props>) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className={wrapperClassName}>
      <input
        id={id}
        type="date"
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        aria-describedby={children ? `${id}Help` : undefined}
        className={`w-full ${inputClassName ?? `cursor-pointer border border-slate-400 bg-white px-3 py-2 text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-700`}`}
      />
      {children ? (
        <small className="block pt-1 text-slate-600" id={`${id}Help`}>
          {children}
        </small>
      ) : null}
    </div>
  );
}

export default DatePicker;
