import { Spin } from 'antd';

type Props = {
  message?: string;
  minHeight?: string;
};

function Loader({ message, minHeight }: Readonly<Props>) {
  return (
    <div
      className="flex w-full items-center justify-center py-16"
      style={minHeight ? { minHeight } : undefined}
    >
      <Spin size="large" description={message || 'Loading…'} />
    </div>
  );
}

export default Loader;
