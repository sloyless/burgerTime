import { useEffect, useMemo, useState } from 'react';
import { doc, DocumentData, Timestamp, updateDoc } from 'firebase/firestore';
import { Form } from 'antd';

import Button from 'components/Button';
import {
  BurgerFormContainer,
  burgerDocumentToFormValues,
  burgerFormValuesToScoreInput,
  BurgerFormValues,
} from 'components/BurgerForm';
import {
  calculateScore,
  calculateTimestamp,
  dateInputValueToUtcDate,
  timestampToDateInputValue,
} from 'functions';
import { getFile, uploadFile } from 'libs/storage';
import { database } from 'utils/firebase';
import { allocateBurgerSlug } from 'utils/burgerSlug';

type Props = {
  burgerId: string;
  initial: DocumentData;
  onCancel: () => void;
  onSaved: () => void;
};

function BurgerEditForm({
  burgerId,
  initial,
  onCancel,
  onSaved,
}: Readonly<Props>) {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<BurgerFormValues>();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const initialValues = useMemo(
    () => burgerDocumentToFormValues(initial),
    [initial]
  );

  const imageUrl = Form.useWatch('image', form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imagePath = await uploadFile(selectedFile, 'burgers/');
      const url = await getFile(imagePath);
      form.setFieldValue('image', url);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  async function handleFinish(values: BurgerFormValues) {
    const fallbackDate =
      initial.timestamp?.seconds != null
        ? calculateTimestamp(initial.timestamp.seconds)
        : undefined;
    const parsedDate = values.reviewDate
      ? dateInputValueToUtcDate(values.reviewDate)
      : (fallbackDate ?? new Date());

    const draft = burgerFormValuesToScoreInput(values);

    setSaving(true);
    try {
      const reviewDateYmd =
        values.reviewDate ||
        timestampToDateInputValue(initial.timestamp) ||
        new Date().toISOString().slice(0, 10);
      const slug = await allocateBurgerSlug(
        values.venue,
        values.burgerName,
        reviewDateYmd,
        burgerId
      );

      await updateDoc(doc(database, 'burgers', burgerId), {
        address: values.address,
        appearance: values.appearance,
        bun: values.bun,
        burgerName: values.burgerName,
        cheese: values.cheese,
        cookType: values.cookType,
        image: values.image,
        meat: values.meat,
        notes: values.notes,
        price: values.price,
        sauce: values.sauce,
        slug,
        timestamp: Timestamp.fromDate(parsedDate),
        total: calculateScore(draft),
        veg: values.veg,
        venue: values.venue,
      });
      onSaved();
    } catch (error) {
      console.error('Failed to update burger:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BurgerFormContainer
      form={form}
      idPrefix="edit-"
      initialValues={initialValues}
      imageUrl={imageUrl}
      isUploading={isUploading}
      selectedFile={selectedFile}
      onSelectImage={setSelectedFile}
      onUploadImage={uploadImage}
      onFinish={handleFinish}
    >
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" status="link" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          status="primary"
          loading={saving}
          disabled={saving}
          onClick={() => form.submit()}
        >
          Save changes
        </Button>
      </div>
    </BurgerFormContainer>
  );
}

export default BurgerEditForm;
