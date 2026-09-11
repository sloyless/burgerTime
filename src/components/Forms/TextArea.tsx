import { ChangeEventHandler, ReactNode } from 'react';

import { formTextareaClass } from './formStyles';

type Props = {
  children?: ReactNode;
  className?: string;
  id: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  value: string;
};

function TextArea({
  children,
  className,
  id,
  onChange,
  placeholder,
  value,
}: Readonly<Props>) {
  return (
    <div className="w-full">
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-describedby={children ? `${id}Help` : undefined}
        className={className ?? formTextareaClass}
      />
      {children ? (
        <small className="block pt-1 text-slate-600" id={`${id}Help`}>
          {children}
        </small>
      ) : null}
    </div>
  );
}

export default TextArea;
