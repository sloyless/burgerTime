import Bone from 'components/Skeleton/Bone';

function CompactCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      aria-hidden
    >
      <Bone className="aspect-5/3 w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Bone className="h-4 w-4/5" />
        <Bone className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function FullCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        featured
          ? 'border-orange-200 ring-2 ring-orange-100'
          : 'border-stone-200 lg:flex lg:min-h-48 lg:items-stretch'
      }`}
      aria-hidden
    >
      <Bone
        className={`w-full rounded-none ${
          featured
            ? 'aspect-5/3'
            : 'aspect-5/3 lg:aspect-auto lg:min-h-48 lg:w-2/5 lg:shrink-0'
        }`}
      />
      <div className="space-y-3 p-5 lg:flex-1">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className={`w-2/3 ${featured ? 'h-8' : 'h-6'}`} />
            <Bone className="h-3 w-1/4" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-3/4" />
          </div>
          <Bone className="size-12 shrink-0 rounded-full" />
        </div>
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div className="w-full min-w-0 flex-1" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading reviews</span>
      <div className="lg:flex lg:gap-8">
        <div className="min-w-0 flex-1 space-y-8 lg:pr-10">
          <Bone className="h-8 w-48" />
          <FullCardSkeleton featured />
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <CompactCardSkeleton key={i} />
            ))}
          </div>
          <div className="hidden flex-col gap-8 lg:flex">
            <FullCardSkeleton />
            <FullCardSkeleton />
          </div>
        </div>
        <aside className="mt-10 min-w-0 lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <Bone className="mb-4 h-6 w-40" />
            <ol className="list-decimal space-y-3 ps-5">
              {Array.from({ length: 10 }, (_, i) => (
                <li key={i} className="space-y-1">
                  <Bone className="h-4 w-full" />
                  <Bone className="h-3 w-4/5" />
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <Bone className="mb-4 h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HomePageSkeleton;
