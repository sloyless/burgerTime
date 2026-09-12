import { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import PageMeta from 'components/PageMeta';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { App, Form } from 'antd';

import { useAuth } from 'context/AuthContext';
import { calculateScore, dateInputValueToUtcDate } from 'functions';
import { database } from 'utils/firebase';

import { Layout } from 'layout';

import Button from 'components/Button';
import {
  BurgerFormContainer,
  emptyBurgerFormValues,
  BurgerFormValues,
  useBurgerFormComplete,
} from 'components/BurgerForm';
import { burgerFormImageFromValues } from 'components/BurgerForm/burgerFormImage';
import { useBurgerPhotoUpload } from 'components/BurgerForm/useBurgerPhotoUpload';
import { Burger } from 'utils/types';
import { syncCollectionSummaryAfterCreate } from 'libs/collectionSummary';
import { allocateBurgerSlug, getBurgerPath } from 'utils/burgerSlug';
import BurgerRules from 'components/BurgerRules';
import { BURGER_WITH_RULES_MAIN_CLASSNAME } from 'theme/layout';

const Add: NextPage = () => {
  const { message } = App.useApp();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<BurgerFormValues>();
  const imageUrl = Form.useWatch('image', form);
  const isFormComplete = useBurgerFormComplete(form);
  const { isUploading, uploadImage } = useBurgerPhotoUpload({ form, message });

  async function handleFinish(values: BurgerFormValues) {
    const image = burgerFormImageFromValues(values);
    const newBurger: Burger = {
      address: values.address,
      appearance: values.appearance,
      bun: values.bun,
      burgerName: values.burgerName,
      cheese: values.cheese,
      cheeseNA: values.cheeseNA,
      cookType: values.cookType,
      image,
      meat: values.meat,
      notes: values.notes,
      price: values.price,
      sauce: values.sauce,
      sauceNA: values.sauceNA,
      timestamp: Timestamp.fromDate(dateInputValueToUtcDate(values.reviewDate)),
      userId: user?.uid,
      veg: values.veg,
      vegNA: values.vegNA,
      venue: values.venue,
    };
    newBurger.total = calculateScore(newBurger);

    setLoading(true);
    try {
      const ref = doc(collection(database, 'burgers'));
      const slug = await allocateBurgerSlug(
        newBurger.venue,
        newBurger.burgerName,
        values.reviewDate
      );
      await setDoc(ref, { ...newBurger, slug });
      await syncCollectionSummaryAfterCreate({
        ...newBurger,
        id: ref.id,
        slug,
      });
      await router.push(getBurgerPath({ ...newBurger, id: ref.id, slug }));
    } catch (error) {
      console.error(error);
      message.error(
        'Could not save this review. Check your connection and try again.',
        6
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout padding={false}>
      <PageMeta title="Add a review" noIndex />
      <main className={BURGER_WITH_RULES_MAIN_CLASSNAME}>
        <div className="max-w-full min-w-0 flex-1">
          <h1 className="mb-6 font-serif text-3xl font-bold text-stone-900">
            Add a review
          </h1>
          <BurgerFormContainer
            form={form}
            initialValues={emptyBurgerFormValues()}
            imageUrl={imageUrl}
            isUploading={isUploading}
            onImageFile={uploadImage}
            onFinish={handleFinish}
            showRatingIntro
          >
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                status="link"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
              <Button
                type="button"
                status="primary"
                loading={loading}
                disabled={loading || !isFormComplete}
                onClick={() => form.submit()}
              >
                Submit review
              </Button>
            </div>
          </BurgerFormContainer>
        </div>
        <BurgerRules />
      </main>
    </Layout>
  );
};

export default Add;
