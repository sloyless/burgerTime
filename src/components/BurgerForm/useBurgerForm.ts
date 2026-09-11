import { useCallback, useEffect, useState } from 'react';
import { DocumentData } from 'firebase/firestore';

import { calculateScore, timestampToDateInputValue } from 'functions';
import { getFile, uploadFile } from 'libs/storage';
import { Burger } from 'utils/types';

import { BurgerFormValues, BurgerRatingKey } from './types';

function defaultReviewDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyBurgerFormValues(): BurgerFormValues {
  return {
    venue: '',
    address: '',
    burgerName: '',
    notes: '',
    cookType: '',
    reviewDate: defaultReviewDate(),
    appearance: 0,
    bun: 0,
    meat: 0,
    cheese: 0,
    veg: 0,
    sauce: 0,
    price: 0,
    image: undefined,
  };
}

export function burgerDocumentToFormValues(doc: DocumentData): BurgerFormValues {
  return {
    venue: doc.venue ?? '',
    address: doc.address ?? '',
    burgerName: doc.burgerName ?? '',
    notes: doc.notes ?? '',
    cookType: doc.cookType ?? '',
    reviewDate: timestampToDateInputValue(doc.timestamp),
    appearance: doc.appearance ?? 0,
    bun: doc.bun ?? 0,
    meat: doc.meat ?? 0,
    cheese: doc.cheese ?? 0,
    veg: doc.veg ?? 0,
    sauce: doc.sauce ?? 0,
    price: doc.price ?? 0,
    image: doc.image,
  };
}

export function burgerFormValuesToScoreInput(values: BurgerFormValues): Burger {
  return {
    appearance: values.appearance,
    bun: values.bun,
    cheese: values.cheese,
    meat: values.meat,
    sauce: values.sauce,
    veg: values.veg,
    image: values.image,
  };
}

type Options = {
  initial?: BurgerFormValues;
};

export function useBurgerForm(options: Options = {}) {
  const [values, setValues] = useState<BurgerFormValues>(
    options.initial ?? emptyBurgerFormValues()
  );
  const [score, setScore] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setScore(calculateScore(burgerFormValuesToScoreInput(values)));
  }, [
    values.appearance,
    values.bun,
    values.cheese,
    values.meat,
    values.sauce,
    values.veg,
    values.image,
  ]);

  const setField = useCallback(
    <K extends keyof BurgerFormValues>(key: K, value: BurgerFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setRating = useCallback((key: BurgerRatingKey, rating: number) => {
    setValues((prev) => ({ ...prev, [key]: rating }));
  }, []);

  const uploadImage = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imagePath = await uploadFile(selectedFile, 'burgers/');
      const imageUrl = await getFile(imagePath);
      setField('image', imageUrl);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, setField]);

  return {
    values,
    setField,
    setRating,
    score,
    selectedFile,
    setSelectedFile,
    isUploading,
    uploadImage,
  };
}
