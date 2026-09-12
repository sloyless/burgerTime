import { Checkbox, Form } from 'antd';
import type { FormInstance, Rule } from 'antd/es/form';

import BurgerOptionalRateField from './BurgerOptionalRateField';
import type { BurgerFormValues, BurgerRatingKey } from './types';

type RatingInputProps = {
  description: string;
  fieldKey: BurgerRatingKey;
  form: FormInstance<BurgerFormValues>;
  na: boolean;
  naField: 'cheeseNA' | 'vegNA' | 'sauceNA';
  onNAToggle: () => void;
  onNotifyValuesChange?: () => void;
  onChange?: (value: number) => void;
  value?: number;
};

function OptionalRatingInput({
  description,
  fieldKey,
  form,
  na,
  naField,
  onNAToggle,
  onNotifyValuesChange,
  onChange,
  value = 0,
}: Readonly<RatingInputProps>) {
  function handleRatingChange(next: number) {
    if (next > 0 && na) {
      form.setFieldsValue({
        [naField]: false,
        [fieldKey]: next,
      });
      onNotifyValuesChange?.();
      return;
    }
    onChange?.(next);
  }

  return (
    <BurgerOptionalRateField
      na={na}
      onNAToggle={onNAToggle}
      value={value}
      onChange={handleRatingChange}
    >
      {description}
    </BurgerOptionalRateField>
  );
}

type FieldCopy = {
  key: BurgerRatingKey;
  label: string;
  description: string;
};

type Props = {
  field: FieldCopy;
  form: FormInstance<BurgerFormValues>;
  naField: 'cheeseNA' | 'vegNA' | 'sauceNA';
  onNotifyValuesChange?: () => void;
  ratingRule: (label: string) => Rule;
};

function OptionalRatingFormItem({
  field,
  form,
  naField,
  onNotifyValuesChange,
  ratingRule,
}: Readonly<Props>) {
  const na = Form.useWatch(naField, form) ?? false;

  function toggleNA() {
    const next = !na;
    form.setFieldsValue({
      [naField]: next,
      ...(next ? { [field.key]: 0 } : {}),
    });
    if (next) {
      form.setFields([{ name: field.key, errors: [] }]);
    }
    onNotifyValuesChange?.();
  }

  return (
    <>
      <Form.Item name={naField} valuePropName="checked" hidden>
        <Checkbox />
      </Form.Item>
      <Form.Item
        name={field.key}
        label={
          <>
            {field.label}
            <span className="font-normal text-stone-500"> (optional)</span>
          </>
        }
        rules={na ? [] : [ratingRule(field.label)]}
      >
        <OptionalRatingInput
          description={field.description}
          fieldKey={field.key}
          form={form}
          na={na}
          naField={naField}
          onNotifyValuesChange={onNotifyValuesChange}
          onNAToggle={toggleNA}
        />
      </Form.Item>
    </>
  );
}

export default OptionalRatingFormItem;
