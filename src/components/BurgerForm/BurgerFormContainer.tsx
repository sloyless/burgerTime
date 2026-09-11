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
  onSelectImage: (file: File | undefined) => void;
  onUploadImage: () => void;
  selectedFile?: File;
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
  onSelectImage,
  onUploadImage,
  selectedFile,
  showRatingIntro,
}: Readonly<Props>) {
  const score = useBurgerFormScore(form);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
      requiredMark="optional"
      scrollToFirstError
      className="min-w-0 max-w-full"
    >
      <BurgerFormFields
        form={form}
        idPrefix={idPrefix}
        imageUrl={imageUrl}
        isUploading={isUploading}
        onSelectImage={onSelectImage}
        onUploadImage={onUploadImage}
        score={score}
        selectedFile={selectedFile}
        showRatingIntro={showRatingIntro}
      />
      {children}
    </Form>
  );
}

export default BurgerFormContainer;
