import PageMeta from 'components/PageMeta';
import { buildBurgerPageMeta } from 'libs/burgerPageMeta';
import type { Burger } from 'utils/types';

type Props = {
  burger: Burger;
  noIndex?: boolean;
  urlSegment: string;
};

function BurgerPageMeta({ burger, noIndex, urlSegment }: Readonly<Props>) {
  const meta = buildBurgerPageMeta(burger, urlSegment, { noIndex });
  return <PageMeta {...meta} />;
}

export default BurgerPageMeta;
