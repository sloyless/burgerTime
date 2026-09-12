import { Form } from 'antd';
import type { FormInstance, Rule } from 'antd/es/form';

import BurgerOptionalRateField from './BurgerOptionalRateField';
import { BurgerFormValues, BurgerRatingKey } from './types';

type FieldCopy = {
  key: BurgerRatingKey;
  label: string;
  description: string;
};

type Props = {
  field: FieldCopy;
  form: FormInstance<BurgerFormValues>;
  naField: 'cheeseNA' | 'vegNA';
  ratingRule: (label: string) => Rule;
};

function OptionalRatingFormItem({
  field,
  form,
  naField,
  ratingRule,
}: Readonly<Props>) {
  const na = Form.useWatch(naField, form) ?? false;

  function toggleNA() {
    const next = !na;
    form.setFieldValue(naField, next);
    if (next) {
      form.setFieldValue(field.key, 0);
    }
  }

  return (
    <Form.Item
      name={field.key}
      label={field.label}
      rules={na ? [] : [ratingRule(field.label)]}
    >
      <BurgerOptionalRateField na={na} onNAToggle={toggleNA}>
        {field.description}
      </BurgerOptionalRateField>
    </Form.Item>
  );
}

export default OptionalRatingFormItem;
