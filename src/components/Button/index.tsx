import { MouseEventHandler, ReactNode } from 'react';
import Link from 'next/link';

type Props = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  status: 'primary' | 'danger' | 'warning' | 'success' | 'text' | 'link';
  type?: 'button' | 'submit' | 'reset';
  url?: string;
};

function Button({ children, disabled, onClick, status, type, url }: Props) {
  const buttonProps = {
    disabled,
    onClick,
    type,
  };
  let bg: string =
    'bg-orange-600 hover:bg-orange-800 text-slate-50 disabled:bg-orange-800/30';

  switch (status) {
    case 'primary':
      bg =
        'bg-orange-600 hover:bg-orange-800 text-slate-50 disabled:bg-orange-800/30';
      break;
    case 'danger':
      bg = 'bg-red-800 hover:bg-red-900 text-slate-50';
      break;
    case 'warning':
      bg = 'bg-yellow-500 hover:bg-yellow-600 text-slate-50';
      break;
    case 'link':
      bg = 'text-red-600 hover:text-red-800';
      break;
  }
  const classes = `inline-block transition-colors py-2 px-5 my-2 rounded ${bg}`;
  if (url)
    return (
      <Link href={url} className={classes}>
        {children}
      </Link>
    );

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

export default Button;
