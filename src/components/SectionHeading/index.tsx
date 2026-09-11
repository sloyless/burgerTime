import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  subtitle?: string;
};

function SectionHeading({ children, subtitle }: Readonly<Props>) {
  return (
    <div className="mb-8 text-center">
      <div className="mb-3 flex items-center gap-4">
        <div className="h-px flex-1 bg-linear-to-r from-transparent to-orange-300" />
        <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          {children}
        </h2>
        <div className="h-px flex-1 bg-linear-to-l from-transparent to-orange-300" />
      </div>
      {subtitle ? (
        <p className="mx-auto max-w-2xl text-sm text-stone-600 md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default SectionHeading;
