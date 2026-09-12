import type { MouseEventHandler, ReactNode } from 'react';
import Link from 'next/link';
import { Button as AntButton } from 'antd';

type Props = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  status: 'primary' | 'danger' | 'warning' | 'success' | 'text' | 'link';
  type?: 'button' | 'submit' | 'reset';
  url?: string;
};

function mapStatus(status: Props['status']) {
  switch (status) {
    case 'danger':
      return { danger: true, type: 'primary' as const };
    case 'link':
      return { type: 'link' as const };
    case 'text':
      return { type: 'text' as const };
    case 'warning':
      return { type: 'default' as const };
    default:
      return { type: 'primary' as const };
  }
}

function Button({
  children,
  disabled,
  loading,
  onClick,
  status,
  type = 'button',
  url,
}: Readonly<Props>) {
  const { type: antType, danger } = mapStatus(status);

  const button = (
    <AntButton
      type={antType}
      danger={danger}
      shape={status === 'link' ? 'default' : 'round'}
      disabled={disabled}
      loading={loading}
      htmlType={type}
      onClick={onClick}
      className={status === 'link' ? 'px-2!' : undefined}
    >
      {children}
    </AntButton>
  );

  if (url) {
    return <Link href={url}>{button}</Link>;
  }

  return button;
}

export default Button;
