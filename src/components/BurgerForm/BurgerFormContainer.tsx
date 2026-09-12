import { ReactNode } from 'react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';

import BurgerFormFields from './BurgerFormFields';
import { useBurgerFormScore } from './useBurgerFormScore';
import { BurgerFormValues } from './types';

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
        const image = form.getFieldValue('image') as string | undefined;
        onFinish({
          ...values,
          image: image ?? values.image,
        });
      }}
      onValuesChange={onValuesChange}
      requiredMark={false}
      scrollToFirstError
      className="max-w-full min-w-0"
    >
      <Form.Item name="image" hidden preserve>
        <input type="hidden" aria-hidden />
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
