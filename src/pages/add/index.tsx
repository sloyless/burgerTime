import { FormEvent, useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Functions
import { useAuth } from 'context/AuthContext';
import { calculateScore } from 'functions';
import { database } from 'utils/firebase';

import { Layout } from 'layout';

// Components
import Button from 'components/Button';
import FieldSet from 'components/Forms/FieldSet';
import Input from 'components/Forms/Input';
import Label from 'components/Forms/Label';
import StarRating from 'components/StarRating';
import { Burger } from 'utils/types';

const Add: NextPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [appearance, setAppearance] = useState(0);
  const [bun, setBun] = useState(0);
  const [cheese, setCheese] = useState(0);
  const [meat, setMeat] = useState(0);
  const [price, setPrice] = useState(0);
  const [sauce, setSauce] = useState(0);
  const [score, setScore] = useState(0);
  const [veg, setVeg] = useState(0);

  // Form Fields
  const venueInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const burgerNameInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const cookInputRef = useRef<HTMLInputElement>(null);

  function updateScoreHandler() {
    const newBurger = {
      appearance,
      bun,
      cheese,
      meat,
      sauce,
      veg,
    };
    setScore(calculateScore(newBurger));
  }

  useEffect(() => {
    updateScoreHandler();
  }, [appearance, bun, cheese, meat, sauce, veg]);

  async function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      appearance === 0 ||
      bun === 0 ||
      cheese === 0 ||
      meat === 0 ||
      sauce === 0 ||
      veg === 0
    )
      return;

    const venue = venueInputRef?.current?.value;
    const address = locationInputRef?.current?.value;
    const burgerName = burgerNameInputRef?.current?.value;
    const notes = notesInputRef?.current?.value;
    const cookType = cookInputRef?.current?.value;

    if (!venue || !address || burgerName) return;

    const timestamp = serverTimestamp();
    const newBurger: Burger = {
      address,
      appearance,
      bun,
      burgerName,
      cheese,
      cookType,
      meat,
      notes,
      price,
      sauce,
      timestamp,
      userId: user?.uid,
      veg,
      venue,
    };
    newBurger.total = calculateScore(newBurger);

    setLoading(true);

    const dbInstance = collection(database, 'burgers'); // connect to Firestore
    try {
      const docRef = await addDoc(dbInstance, newBurger);
      router.push(`/dashboard`);
      setLoading(false);
      return docRef?.id;
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Add a Burger :: BurgerTime</title>
      </Head>
      <main className="md:flex md:gap-4">
        <div className="container mx-auto mt-5 px-8">
          <h1 className="text-3xl">Add a Burger</h1>
          <section>
            <form onSubmit={submitHandler} className="my-5">
              <FieldSet>
                <div className="md:flex md:w-1/2">
                  <Label id="venue">Venue Name</Label>
                  <Input
                    errorMessage="Please enter a venue."
                    id="venue"
                    ref={venueInputRef}
                    type="text"
                    placeholder="Shake Shack"
                    required
                  >
                    Enter the name of the restaurant, fast food chain, special
                    event, or venue.
                  </Input>
                </div>
                <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                  <Label id="address">Location</Label>
                  <Input
                    id="address"
                    ref={locationInputRef}
                    type="text"
                    placeholder="51 Astor Place, New York, NY 10003"
                    required
                  >
                    Enter the address or city & state of the venue.
                  </Input>
                </div>
              </FieldSet>
              <FieldSet>
                <Label id="burgerName">Burger Name</Label>
                <Input
                  errorMessage="Please enter the name of the burger you ordered."
                  id="burgerName"
                  ref={burgerNameInputRef}
                  type="text"
                  placeholder="Shackburger"
                  required
                >
                  Enter the name of the burger you ordered.
                </Input>
              </FieldSet>
              <h2 className="mt-5 text-2xl font-bold">Rating</h2>
              <div className="flex items-end justify-between">
                <p className="mb-3 me-5 w-4/5 text-sm md:text-base">
                  For the following fields, rate the quality of each category on
                  a 5-star scale.
                </p>
                <p className="mb-3 text-end">Current Score: {score}</p>
              </div>

              <FieldSet>
                <div className="md:flex md:w-1/2">
                  <Label id="appearance">Appearance</Label>
                  <StarRating
                    id="appearance"
                    rating={appearance}
                    updateRating={setAppearance}
                  >
                    How was the presentation of the burger? Perfectly crafted?
                    Shoved into a fast food wrapper?
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                  <Label id="bun">Bun</Label>
                  <StarRating id="bun" rating={bun} updateRating={setBun}>
                    If a great burger is a classic painting, then the bun is the
                    frame. It&apos;s the handle. It&apos;s the rhythm section.
                    It&apos;s the wrapping that brings the whole thing together.
                  </StarRating>
                </div>
              </FieldSet>
              <FieldSet>
                <div className="md:flex md:w-1/2">
                  <Label id="meat">Meat</Label>
                  <StarRating id="meat" rating={meat} updateRating={setMeat}>
                    The burger itself. This category covers flavor, texture,
                    juiciness, and done-ness.
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                  <Label id="cheese">Cheese</Label>
                  <StarRating
                    id="cheese"
                    rating={cheese}
                    updateRating={setCheese}
                  >
                    How was the cheese? Meltiness, quality, quantity, etc.
                  </StarRating>
                </div>
              </FieldSet>
              <FieldSet>
                <div className="md:flex md:w-1/2">
                  <Label id="veg">Vegetables</Label>
                  <StarRating id="veg" rating={veg} updateRating={setVeg}>
                    This covers lettuce, onion, tomato, pickle, peppers, kimchi,
                    and anything else that might be used to dress up the burger
                    in question.
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                  <Label id="sauce">Sauces</Label>
                  <StarRating id="sauce" rating={sauce} updateRating={setSauce}>
                    Ketchup, mustard, aoli, peanut butter, special sauce, or
                    anything spreadable on the burger.
                  </StarRating>
                </div>
              </FieldSet>
              <h2 className="mt-5 text-2xl font-bold">Miscellaneous</h2>
              <p className="mb-3">
                Other optional details you may want to enter.
              </p>
              <FieldSet>
                <div className="md:flex md:w-1/2">
                  <Label id="venue">Cook Type</Label>
                  <Input
                    id="cookType"
                    ref={cookInputRef}
                    type="text"
                    placeholder="Grill"
                  >
                    How was the burger cooked? Griddle? Propane or Charcoal
                    Grill? Campfire?
                  </Input>
                </div>
                <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                  <Label id="address">Price</Label>
                  <StarRating id="price" rating={price} updateRating={setPrice}>
                    Price level. Does not affect the rating.
                  </StarRating>
                </div>
              </FieldSet>
              <FieldSet>
                <Label id="notes">Notes</Label>
                <Input id="notes" ref={notesInputRef} type="text">
                  Any additional information to share?
                </Input>
              </FieldSet>
              <div className="w-auto text-center">
                <Button
                  type="button"
                  status="link"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" status="primary">
                  {loading ? '...' : 'Submit'}
                </Button>
              </div>
            </form>
          </section>
        </div>
        <aside className="w-full bg-slate-500 p-4 text-white md:w-1/4">
          <h2 className="mb-3 text-xl">How does the scoring work?</h2>
          <ul>
            <li className="mb-3 flex gap-1">
              <div className="h-[40px] w-[60px] bg-green-900 py-3 text-center text-xs text-white">
                95-100
              </div>
              <span className="ms-1 w-2/3 text-xs leading-none">
                I could eat this burger every day for the rest of my life.
              </span>
            </li>
            <li className="mb-3 flex gap-1">
              <div className="h-[40px] w-[60px] bg-green-600 py-3 text-center text-xs text-white">
                80-95
              </div>
              <span className="ms-1 w-2/3 text-xs leading-none">
                This is, excuse me, a damn fine burger.
              </span>
            </li>
            <li className="mb-3 flex gap-1">
              <div className="h-[40px] w-[60px] bg-yellow-500 py-3 text-center text-xs text-white">
                50-80
              </div>
              <span className="ms-1 w-2/3 text-xs leading-none">
                This is a decent burger.
              </span>
            </li>
            <li className="mb-3 flex gap-1">
              <div className="h-[40px] w-[60px] bg-orange-500 py-3 text-center text-xs text-white">
                20-50
              </div>
              <span className="ms-1 w-2/3 text-xs leading-none">
                I&apos;m glad I ate this once so I know I never have to eat it
                again.
              </span>
            </li>
            <li className="mb-3 flex gap-1">
              <div className="h-[40px] w-[60px] bg-red-900 py-3 text-center text-xs text-white">
                &lt; 20
              </div>
              <span className="ms-1 w-2/3 text-xs leading-none">
                Send this garbage back to the nightmare it came from.
              </span>
            </li>
          </ul>
          <hr />
          <h3 className="my-3 text-lg">Score Breakdown</h3>
          <strong>Appearance</strong>
          <p className="mb-3 text-sm">Max score: 5pts</p>
          <strong>Bun</strong>
          <p className="mb-3 text-sm">Max score: 15pts</p>
          <strong>Meat</strong>
          <p className="mb-3 text-sm">Max score: 30pts</p>
          <strong>Cheese</strong>
          <p className="mb-3 text-sm">Max score: 25pts</p>
          <strong>Vegetables</strong>
          <p className="mb-3 text-sm">Max score: 15pts</p>
          <strong>Sauces</strong>
          <p className="mb-3 text-sm">Max score: 15pts</p>
        </aside>
      </main>
    </Layout>
  );
};

export default Add;
