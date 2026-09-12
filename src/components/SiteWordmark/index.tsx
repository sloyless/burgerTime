import Image from 'next/image';

type Props = {
  as?: 'h1' | 'span';
  className?: string;
  logoClassName?: string;
  priority?: boolean;
};

function SiteWordmark({
  as = 'span',
  className = '',
  logoClassName = 'h-[0.9em]',
  priority = false,
}: Readonly<Props>) {
  const Tag = as;

  return (
    <Tag
      className={`font-venue inline-flex items-center gap-0.5 leading-normal ${className}`}
    >
      Burger
      <Image
        src="/logo.png"
        alt=""
        width={40}
        height={33}
        priority={priority}
        aria-hidden
        className={`w-auto shrink-0 ${logoClassName}`}
      />
      Time
    </Tag>
  );
}

export default SiteWordmark;
