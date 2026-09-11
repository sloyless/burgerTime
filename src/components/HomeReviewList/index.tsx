import { Burger } from 'utils/types';
import { getBurgerPath } from 'utils/burgerSlug';
import Card from 'components/Card';

type Props = {
  listItems: Burger[];
};

function HomeReviewList({ listItems }: Readonly<Props>) {
  if (!listItems.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {listItems.map((item) => (
          <Card
            key={`compact-${item.id}`}
            compact
            burger={item}
            url={getBurgerPath(item)}
          />
        ))}
      </div>
      <div className="hidden flex-col gap-8 lg:flex">
        {listItems.map((item) => (
          <Card
            key={`full-${item.id}`}
            burger={item}
            url={getBurgerPath(item)}
          />
        ))}
      </div>
    </>
  );
}

export default HomeReviewList;
