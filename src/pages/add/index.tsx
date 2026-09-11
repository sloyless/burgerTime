import { FormEvent, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

import { useAuth } from 'context/AuthContext';
import { calculateScore, dateInputValueToUtcDate } from 'functions';
import { database } from 'utils/firebase';

import { Layout } from 'layout';

import Button from 'components/Button';
import {
  BurgerForm,
  isBurgerFormComplete,
  useBurgerForm,
} from 'components/BurgerForm';
import { Burger } from 'utils/types';
import BurgerRules from 'components/BurgerRules';

const Add: NextPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    values,
    setField,
    setRating,
    score,
    selectedFile,
    setSelectedFile,
    isUploading,
    uploadImage,
  } = useBurgerForm();

  async function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isBurgerFormComplete(values)) {
      return;
    }

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

    const dbInstance = collection(database, 'burgers');
    try {
      const docRef = await addDoc(dbInstance, newBurger);
      router.push(`/`);
      setLoading(false);
      return docRef?.id;
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  return (
    <Layout padding={false}>
      <Head>
        <title>Add a Burger :: BurgerTime</title>
      </Head>
      <main className="min-w-0 px-3 md:flex md:px-0 md:pl-3 xl:flex-row">
        <div className="my-5 min-w-0 max-w-full md:mr-8">
          <h1 className="mb-4 text-2xl font-extrabold text-orange-600">
            Add a Burger
          </h1>
          <form onSubmit={submitHandler}>
              <BurgerForm
                values={values}
                setField={setField}
                setRating={setRating}
                score={score}
                selectedFile={selectedFile}
                isUploading={isUploading}
                onSelectImage={setSelectedFile}
                onUploadImage={uploadImage}
                showRatingIntro
              />
              <div className="mt-5 w-auto text-center">
                <Button
                  type="button"
                  status="link"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button type="submit" status="primary" disabled={loading}>
                  {loading ? '...' : 'Submit'}
                </Button>
              </div>
          </form>
        </div>
        <BurgerRules />
      </main>
    </Layout>
  );
};

export default Add;
