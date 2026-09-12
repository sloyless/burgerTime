export type BurgerRatingKey =
  'appearance' | 'bun' | 'meat' | 'cheese' | 'veg' | 'sauce';

export type BurgerFormValues = {
  venue: string;
  address: string;
  burgerName: string;
  notes: string;
  cookType: string;
  reviewDate: string;
  appearance: number;
  bun: number;
  meat: number;
  cheese: number;
  cheeseNA: boolean;
  veg: number;
  vegNA: boolean;
  sauce: number;
  sauceNA: boolean;
  price: number;
  image?: string;
};
