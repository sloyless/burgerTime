import type { ReactNode } from 'react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';

import BurgerFormFields from './BurgerFormFields';
import { useBurgerFormScore } from './useBurgerFormScore';
import { burgerFormImagesFromValues } from './burgerFormImage';
import type { BurgerFormValues } from './types';

type Props = {
  children?: ReactNode;
  form: FormInstance<BurgerFormValues>;
  idPrefix?: string;
  imageUrl?: string;
  initialValues?: BurgerFormValues;
  isUploading: boolean;
  onFinish: (values: BurgerFormValues) => void;
  onValuesChange?: () => void;
  onImageFile: (file: File) => Promise<void>;
  showRatingIntro?: boolean;
};

function BurgerFormContainer({
  children,
  form,
  idPrefix,
  imageUrl,
  initialValues,
  isUploading,
  onFinish,
  onValuesChange,
  onImageFile,
  showRatingIntro,
}: Readonly<Props>) {
  const score = useBurgerFormScore(form);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={(values) => {
        const images = burgerFormImagesFromValues(values);
        onFinish({
          ...values,
          image: images.image ?? form.getFieldValue('image'),
          imageCard: images.imageCard ?? form.getFieldValue('imageCard'),
        });
      }}
      onValuesChange={onValuesChange}
      requiredMark={false}
      scrollToFirstError
      className="max-w-full min-w-0"
    >
      <Form.Item name="image" hidden preserve>
        <input type="hidden" aria-hidden="true" />
      </Form.Item>
      <Form.Item name="imageCard" hidden preserve>
        <input type="hidden" aria-hidden="true" />
      </Form.Item>
      <BurgerFormFields
        form={form}
        idPrefix={idPrefix}
        imageUrl={imageUrl}
        isUploading={isUploading}
        onImageFile={onImageFile}
        onNotifyValuesChange={onValuesChange}
        score={score}
        showRatingIntro={showRatingIntro}
      />
      {children}
    </Form>
  );
}

export default BurgerFormContainer;
