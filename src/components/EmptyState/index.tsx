import { Empty } from 'antd';

type Props = {
  message?: string;
  title?: string;
};

function EmptyState({ message, title }: Readonly<Props>) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-4 py-8">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span className="font-sans text-stone-600">
            {title ? (
              <>
                <span className="block font-serif text-lg font-bold text-stone-800">
                  {title}
                </span>
                {message}
              </>
            ) : (
              message || 'Nothing here yet.'
            )}
          </span>
        }
      />
    </div>
  );
}

export default EmptyState;
