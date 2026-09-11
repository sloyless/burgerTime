import { ChangeEventHandler, ReactNode } from 'react';

import { formControlClass } from './formStyles';

type Props = {
  children?: ReactNode;
  disabled?: boolean;
  id: string;
  inputClassName?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'url';
  value: string;
};

function TextField({
  children,
  disabled,
  id,
  inputClassName,
  onChange,
  placeholder,
  required,
  type = 'text',
  value,
}: Readonly<Props>) {
  return (
    <div className="w-full">
      <input
        id={id}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-describedby={children ? `${id}Help` : undefined}
        className={inputClassName ?? formControlClass}
      />
      {children ? (
        <small className="block pt-1 text-slate-600" id={`${id}Help`}>
          {children}
        </small>
      ) : null}
    </div>
  );
}

export default TextField;
