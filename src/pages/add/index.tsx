import { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import PageMeta from 'components/PageMeta';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Form } from 'antd';

import { useAuth } from 'context/AuthContext';
import { calculateScore, dateInputValueToUtcDate } from 'functions';
import { database } from 'utils/firebase';
import { getFile, uploadFile } from 'libs/storage';

import { Layout } from 'layout';

import Button from 'components/Button';
import {
  BurgerFormContainer,
  emptyBurgerFormValues,
  BurgerFormValues,
} from 'components/BurgerForm';
import { Burger } from 'utils/types';
import { allocateBurgerSlug, getBurgerPath } from 'utils/burgerSlug';
import BurgerRules from 'components/BurgerRules';
import { BURGER_WITH_RULES_MAIN_CLASSNAME } from 'theme/layout';

const Add: NextPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<BurgerFormValues>();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const imageUrl = Form.useWatch('image', form);

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
    const newBurger: Burger = {
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
      timestamp: Timestamp.fromDate(dateInputValueToUtcDate(values.reviewDate)),
      userId: user?.uid,
      veg: values.veg,
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
      await router.push(getBurgerPath({ ...newBurger, id: ref.id, slug }));
    } catch (error) {
      console.error(error);
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
            selectedFile={selectedFile}
            onSelectImage={setSelectedFile}
            onUploadImage={uploadImage}
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
                disabled={loading}
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
