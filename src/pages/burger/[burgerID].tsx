import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
// import Image from 'next/image';
import Head from 'next/head';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

import { Layout } from 'layout';
import { database } from 'utils/firebase';
import {
  calculateScore,
  calculateScoreColor,
  calculateTimestamp,
  getFormattedDate,
} from 'functions';
import BurgerRules from 'components/BurgerRules';
import FieldSet from 'components/Forms/FieldSet';
import Label from 'components/Forms/Label';
import StarRating from 'components/StarRating';
// App Store

const BurgerPage: NextPage = () => {
  // Import in Router and Auth
  const router = useRouter();
  const { burgerID } = router.query;

  // Initialize state
  const [loading, setLoading] = useState(true);
  const [burger, setBurger] = useState<DocumentData>();

  // Get data if currentTeam set or changed
  useEffect(() => {
    // Get data from appState if exists, otherwise fetch from Firebase
    setLoading(true);

    if (burgerID) {
      // Get real-time data to monitor changes
      const dbInstance = doc(database, 'burgers', burgerID.toString());
      const unsub = onSnapshot(dbInstance, (docData) => {
        setBurger(docData.data());
      });

      setLoading(false);
      return unsub;
    }
  }, [burgerID]);

  if (loading) return <div className="mt-5 pt-5">Loading...</div>;

  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();
  const score = burger ? calculateScore(burger) : 100;
  const color = calculateScoreColor(burger?.total || score);

  // Page <head> props
  const pageTitle = `${burger?.venue} - ${burger?.burgerName} :: BurgerTime`;

  return (
    <Layout>
      <Head>
        <title>{pageTitle} :: BurgerTime</title>
      </Head>
      <main className="md:flex md:gap-4">
        <div className="container mx-auto my-5 px-8">
          {burger ? (
            <>
              <div className="mb-2 flex w-full justify-between gap-4 pb-2">
                <div className="mt-auto">
                  <h1 className="text-4xl">{burger.venue}</h1>
                  <div className="line-clamp-1 text-xs">
                    <FontAwesomeIcon
                      icon={faGlobe}
                      size="sm"
                      className="mx-auto me-1 inline-block w-[12px] align-bottom"
                    />{' '}
                    {burger.address}
                  </div>
                </div>
                <div className="w-1/5 md:w-1/6">
                  <div
                    className={`rounded-xl border border-white ${color} box-shadow p-1 text-center text-white `}
                  >
                    <strong className="text-[10px] uppercase tracking-widest">
                      Score
                    </strong>
                    <br />
                    <span className="text-3xl">{score}</span>
                  </div>
                </div>
              </div>

              <hr className="my-3 w-full" />

              <div className="mt-4">
                <h2 className="text-2xl">{burger.burgerName}</h2>
                <div className="mb-3 text-sm">
                  <strong>Visited: </strong>
                  <time dateTime={timestampISO}>
                    {timestampDate && getFormattedDate(timestampDate, true)}
                  </time>
                </div>
                {burger.notes ? (
                  <p className="mb-4 line-clamp-2 pe-4 text-sm">
                    <strong>Notes:</strong>{' '}
                    <span className="italic">{burger.notes}</span>
                  </p>
                ) : null}

                <h2 className="mb-1 text-xl">Rating</h2>
                <FieldSet>
                  <div className="md:flex md:w-1/2">
                    <Label id="appearance">Appearance</Label>
                    <StarRating id="appearance" rating={burger.appearance}>
                      How was the presentation of the burger? Perfectly crafted?
                      Shoved into a fast food wrapper?
                    </StarRating>
                  </div>
                  <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                    <Label id="bun">Bun</Label>
                    <StarRating id="bun" rating={burger.appearance}>
                      If a great burger is a classic painting, then the bun is
                      the frame. It&apos;s the handle. It&apos;s the rhythm
                      section. It&apos;s the wrapping that brings the whole
                      thing together.
                    </StarRating>
                  </div>
                </FieldSet>
                <FieldSet>
                  <div className="md:flex md:w-1/2">
                    <Label id="meat">Meat</Label>
                    <StarRating id="meat" rating={burger.meat}>
                      The burger itself. This category covers flavor, texture,
                      juiciness, and done-ness.
                    </StarRating>
                  </div>
                  <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                    <Label id="cheese">Cheese</Label>
                    <StarRating id="cheese" rating={burger.cheese}>
                      How was the cheese? Meltiness, quality, quantity, etc.
                    </StarRating>
                  </div>
                </FieldSet>
                <FieldSet>
                  <div className="md:flex md:w-1/2">
                    <Label id="veg">Vegetables</Label>
                    <StarRating id="veg" rating={burger.veg}>
                      This covers lettuce, onion, tomato, pickle, peppers,
                      kimchi, and anything else that might be used to dress up
                      the burger in question.
                    </StarRating>
                  </div>
                  <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                    <Label id="sauce">Sauces</Label>
                    <StarRating id="sauce" rating={burger.sauce}>
                      Ketchup, mustard, aoli, peanut butter, special sauce, or
                      anything spreadable on the burger.
                    </StarRating>
                  </div>
                </FieldSet>
                <h2 className="mt-5 text-2xl font-bold">Miscellaneous</h2>
                <FieldSet>
                  <div className="md:flex md:w-1/2">
                    <Label id="venue">Cook Type</Label>
                    <p className="py-2">{burger.cookType || 'Unknown'}</p>
                  </div>
                  <div className="mt-3 md:mt-0 md:flex md:w-1/2">
                    <Label id="address">Price</Label>
                    <StarRating id="price" rating={burger.price}>
                      Price level. Does not affect the rating.
                    </StarRating>
                  </div>
                </FieldSet>
              </div>
            </>
          ) : null}
        </div>
        <BurgerRules />
      </main>
    </Layout>
  );
};

export default BurgerPage;
