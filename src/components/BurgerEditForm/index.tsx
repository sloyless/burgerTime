import { FormEvent, useState } from 'react';
import { doc, DocumentData, Timestamp, updateDoc } from 'firebase/firestore';

import Button from 'components/Button';
import {
  BurgerForm,
  burgerDocumentToFormValues,
  burgerFormValuesToScoreInput,
  isBurgerFormComplete,
  useBurgerForm,
} from 'components/BurgerForm';
import {
  calculateScore,
  calculateTimestamp,
  dateInputValueToUtcDate,
} from 'functions';
import { database } from 'utils/firebase';

type Props = {
  burgerId: string;
  initial: DocumentData;
  onCancel: () => void;
  onSaved: () => void;
};

function BurgerEditForm({ burgerId, initial, onCancel, onSaved }: Readonly<Props>) {
  const [saving, setSaving] = useState(false);
  const {
    values,
    setField,
    setRating,
    score,
    selectedFile,
    setSelectedFile,
    isUploading,
    uploadImage,
  } = useBurgerForm({ initial: burgerDocumentToFormValues(initial) });

  async function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isBurgerFormComplete(values)) {
      return;
    }

    const fallbackDate =
      initial.timestamp?.seconds != null
        ? calculateTimestamp(initial.timestamp.seconds)
        : undefined;
    const parsedDate = values.reviewDate
      ? dateInputValueToUtcDate(values.reviewDate)
      : fallbackDate ?? new Date();

    const draft = burgerFormValuesToScoreInput(values);

    setSaving(true);
    try {
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
    <form onSubmit={submitHandler} className="min-w-0 max-w-full">
      <BurgerForm
        idPrefix="edit-"
        formClassName="min-w-0 max-w-full"
        values={values}
        setField={setField}
        setRating={setRating}
        score={score}
        selectedFile={selectedFile}
        isUploading={isUploading}
        onSelectImage={setSelectedFile}
        onUploadImage={uploadImage}
      />
      <div className="mt-5 text-center">
        <Button type="button" status="link" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" status="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

export default BurgerEditForm;
