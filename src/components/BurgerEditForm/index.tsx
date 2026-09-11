import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, DocumentData, Timestamp, updateDoc } from 'firebase/firestore';
import { App, Form } from 'antd';

import Button from 'components/Button';
import {
  areBurgerFormValuesEqual,
  BurgerFormContainer,
  burgerDocumentToFormValues,
  burgerFormValuesToScoreInput,
  BurgerFormValues,
  useBurgerFormComplete,
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
  onSaved: (slug: string) => void;
};

function BurgerEditForm({
  burgerId,
  initial,
  onCancel,
  onSaved,
}: Readonly<Props>) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [form] = Form.useForm<BurgerFormValues>();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const initialValues = useMemo(
    () => burgerDocumentToFormValues(initial),
    [initial, burgerId]
  );

  const imageUrl = Form.useWatch('image', form) ?? initialValues.image;
  const isFormComplete = useBurgerFormComplete(form);

  const syncDirtyState = useCallback(() => {
    const current = form.getFieldsValue(true) as BurgerFormValues;
    const hasFormChanges = !areBurgerFormValuesEqual(current, initialValues);
    setIsDirty(hasFormChanges || Boolean(selectedFile));
  }, [form, initialValues, selectedFile]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setSelectedFile(undefined);
    setIsDirty(false);
  }, [form, initialValues]);

  useEffect(() => {
    syncDirtyState();
  }, [selectedFile, syncDirtyState]);

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const imagePath = await uploadFile(selectedFile, 'burgers/');
      const url = await getFile(imagePath);
      form.setFieldValue('image', url);
      setSelectedFile(undefined);
      syncDirtyState();
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
        meat: values.meat,
        notes: values.notes,
        price: values.price,
        sauce: values.sauce,
        slug,
        timestamp: Timestamp.fromDate(parsedDate),
        total: calculateScore(draft),
        veg: values.veg,
        venue: values.venue,
        ...(values.image ? { image: values.image } : {}),
      });
      onSaved(slug);
    } catch (error) {
      console.error('Failed to update burger:', error);
      message.error(
        'Could not save changes. You may not have permission or the network failed.',
        6
      );
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
      onValuesChange={syncDirtyState}
    >
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" status="link" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          status="primary"
          loading={saving}
          disabled={saving || !isDirty || !isFormComplete}
          onClick={() => form.submit()}
        >
          Save changes
        </Button>
      </div>
    </BurgerFormContainer>
  );
}

export default BurgerEditForm;
