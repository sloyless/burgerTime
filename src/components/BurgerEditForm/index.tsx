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
import { syncCollectionSummaryAfterUpdate } from 'libs/collectionSummary';
import { deleteBurgerPhotoByUrl, uploadBurgerPhotoReplacingPrevious } from 'libs/storage';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
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
  const [isUploading, setIsUploading] = useState(false);

  const initialValues = useMemo(
    () => burgerDocumentToFormValues(initial),
    [initial, burgerId]
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
    const hasFormChanges = !areBurgerFormValuesEqual(current, initialValues);
    setIsDirty(hasFormChanges);
  }, [form, initialValues]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setIsDirty(false);
  }, [form, initialValues]);

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    try {
      const previousUrl =
        form.getFieldValue('image') ?? initialValues.image;
      const url = await uploadBurgerPhotoReplacingPrevious(file, previousUrl, {
        retainCommittedUrl: initialValues.image,
      });
      form.setFieldValue('image', url);
      syncDirtyState();
    } catch (error) {
      console.error('Image upload failed:', error);
      message.error('Photo upload failed.', 5);
      throw error;
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

    const image =
      values.image ?? (form.getFieldValue('image') as string | undefined);
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

      const previousImage = initialValues.image;
      const nextImage = image;
      if (previousImage && previousImage !== nextImage) {
        await deleteBurgerPhotoByUrl(previousImage);
      }

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
