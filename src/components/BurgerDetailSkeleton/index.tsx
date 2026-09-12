import Bone from 'components/Skeleton/Bone';
import {
  BURGER_WITH_RULES_MAIN_CLASSNAME,
  STACK_SPACE_CLASSNAME,
} from 'theme/layout';

import BurgerRules from 'components/BurgerRules';

function BurgerDetailSkeleton() {
  return (
    <main className={BURGER_WITH_RULES_MAIN_CLASSNAME} aria-busy="true">
      <span className="sr-only">Loading review</span>
      <div className={`max-w-full min-w-0 flex-1 ${STACK_SPACE_CLASSNAME}`}>
        <div className="overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-sm">
          <div className="border-b border-orange-100/90 bg-stone-50 p-4 md:p-6">
            <div className="flex gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Bone className="h-9 w-3/4 md:h-10" />
                <Bone className="h-3 w-full max-w-md" />
              </div>
              <Bone className="hidden size-14 shrink-0 rounded-full md:block" />
            </div>
          </div>
          <Bone className="aspect-5/3 w-full rounded-none" />
          <div className="space-y-4 p-4 md:p-6">
            <Bone className="h-7 w-1/2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-5/6" />
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
          <Bone className="mb-6 h-7 w-24" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-4 w-28" />
                <Bone className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <BurgerRules />
    </main>
  );
}

export default BurgerDetailSkeleton;
