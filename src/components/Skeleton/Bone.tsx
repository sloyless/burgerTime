type Props = {
  className?: string;
};

function Bone({ className = '' }: Readonly<Props>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200/90 ${className}`.trim()}
      aria-hidden
    />
  );
}

export default Bone;
