import type { BurgerCollectionStats } from 'libs/burgerStats';
import type { ServerBurger } from 'utils/serverBurger';

export const HOME_PAGE_SIZE = 25;

export type HomePageInitialData = {
  count: number;
  totalPages: number;
  nextPageCursorEncoded: string | null;
  pageItems: ServerBurger[];
  topTen: ServerBurger[];
  stats: BurgerCollectionStats | null;
  listPagination?: { prev?: string; next?: string };
};

export type HomePageProps = {
  initialHome: HomePageInitialData | null;
};
