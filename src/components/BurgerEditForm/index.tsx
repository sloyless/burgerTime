import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  doc,
  type DocumentData,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { App, Form } from 'antd';

import Button from 'components/Button';
import {
  areBurgerFormValuesEqual,
  BurgerFormContainer,
  burgerDocumentToFormValues,
  burgerFormValuesToScoreInput,
  type BurgerFormValues,
  useBurgerFormComplete,
} from 'components/BurgerForm';
import { burgerFormImageFromValues } from 'components/BurgerForm/burgerFormImage';
import { useBurgerPhotoUpload } from 'components/BurgerForm/useBurgerPhotoUpload';
import {
  calculateScore,
  calculateTimestamp,
  dateInputValueToUtcDate,
  timestampToDateInputValue,
} from 'functions';
import { syncCollectionSummaryAfterUpdate } from 'libs/collectionSummary';
import { deleteReplacedBurgerPhotoAfterSave } from 'libs/storage';
import { database } from 'utils/firebase';
import type { Burger } from 'utils/types';
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

  const initialValues = useMemo(
    () => burgerDocumentToFormValues(initial),
    [initial]
  );

  const imageUrl = Form.useWatch('image', form) ?? initialValues.image;
  const isFormComplete = useBurgerFormComplete(form);

  const syncDirtyState = useCallback(() => {
    const current = {
      ...form.getFieldsValue(true),
      cheeseNA: Boolean(form.getFieldValue('cheeseNA')),
      vegNA: Boolean(form.getFieldValue('vegNA')),
      sauceNA: Boolean(form.getFieldValue('sauceNA')),
    } as BurgerFormValues;
    setIsDirty(!areBurgerFormValuesEqual(current, initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setIsDirty(false);
  }, [form, initialValues]);

  const { isUploading, uploadImage } = useBurgerPhotoUpload({
    form,
    message,
    retainCommittedUrl: initialValues.image,
    onUploaded: syncDirtyState,
  });

  async function handleFinish(values: BurgerFormValues) {
    const fallbackDate =
      initial.timestamp?.seconds != null
        ? calculateTimestamp(initial.timestamp.seconds)
        : undefined;
    const parsedDate = values.reviewDate
      ? dateInputValueToUtcDate(values.reviewDate)
      : (fallbackDate ?? new Date());

    const image = burgerFormImageFromValues(values);
    const valuesWithImage: BurgerFormValues = { ...values, image };
    const draft = burgerFormValuesToScoreInput(valuesWithImage);

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

      const beforeBurger = { ...(initial as Burger), id: burgerId };
      const total = calculateScore(draft);

      await updateDoc(doc(database, 'burgers', burgerId), {
        address: values.address,
        appearance: values.appearance,
        bun: values.bun,
        burgerName: values.burgerName,
        cheese: values.cheese,
        cheeseNA: values.cheeseNA,
        cookType: values.cookType,
        meat: values.meat,
        notes: values.notes,
        price: values.price,
        sauce: values.sauce,
        sauceNA: values.sauceNA,
        slug,
        timestamp: Timestamp.fromDate(parsedDate),
        total,
        veg: values.veg,
        vegNA: values.vegNA,
        venue: values.venue,
        ...(image ? { image } : {}),
      });

      const afterBurger: Burger = {
        ...beforeBurger,
        address: values.address,
        appearance: values.appearance,
        bun: values.bun,
        burgerName: values.burgerName,
        cheese: values.cheese,
        cheeseNA: values.cheeseNA,
        cookType: values.cookType,
        meat: values.meat,
        notes: values.notes,
        price: values.price,
        sauce: values.sauce,
        sauceNA: values.sauceNA,
        slug,
        timestamp: Timestamp.fromDate(parsedDate),
        total,
        veg: values.veg,
        vegNA: values.vegNA,
        venue: values.venue,
        image: image ?? beforeBurger.image,
      };

      await syncCollectionSummaryAfterUpdate(beforeBurger, afterBurger);
      await deleteReplacedBurgerPhotoAfterSave(initialValues.image, image);

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
      onImageFile={uploadImage}
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
