import { useMemo } from 'react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';

import { calculateScore } from 'functions';

import { burgerFormValuesToScoreInput, emptyBurgerFormValues } from './useBurgerForm';
import { BurgerFormValues } from './types';

export function useBurgerFormScore(form: FormInstance<BurgerFormValues>) {
  const watched = Form.useWatch([], form);

  return useMemo(() => {
    const values = { ...emptyBurgerFormValues(), ...watched };
    return calculateScore(burgerFormValuesToScoreInput(values));
  }, [watched]);
}
