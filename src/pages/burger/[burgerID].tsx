import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Image from 'next/image';
import Head from 'next/head';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

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
import Divider from 'components/Divider';
import LocationLink from 'components/LocationLink';

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
  }, [burgerID, loading]);

  if (loading) return <div className="mt-5 pt-5">Loading...</div>;

  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();
  const score = burger ? calculateScore(burger) : 100;
  const color = calculateScoreColor(burger?.total || score);

  // Page <head> props
  const pageTitle = `${burger?.venue ?? ''} - ${burger?.burgerName ?? ''} :: BurgerTime`;

  return (
    <Layout padding={false}>
      <Head>
        <title>{pageTitle} :: BurgerTime</title>
      </Head>
      <main className="px-3 md:flex md:px-0 md:pl-3 xl:flex-row">
        <div className="my-5 md:mr-8">
          {burger ? (
            <>
              <div className="flex flex-row">
                <div className="flex-1 pr-5">
                  <div className="flex flex-row items-end justify-between">
                    <h3 className="text-3xl font-extrabold text-orange-600">
                      {burger.venue}
                    </h3>
                    <span className="hidden pb-1 pl-3 lg:block">
                      <time dateTime={timestampISO}>
                        {timestampDate && getFormattedDate(timestampDate)}
                      </time>
                    </span>
                  </div>
                  <hr className="my-1 w-full" />
                  <LocationLink burger={burger} />
                </div>
                <div className="w-[90px]">
                  <div
                    className={`rounded-xl border border-white text-white ${color} box-shadow p-1 text-center`}
                  >
                    <strong className="text-[10px] uppercase tracking-wide">
                      Score
                    </strong>
                    <br />
                    <span className="text-4xl leading-5">
                      {calculateScore(burger)}
                    </span>
                  </div>
                </div>
              </div>

              {burger.image && (
                <div className="mt-4">
                  <Image
                    src={burger.image}
                    alt={burger.burgerName}
                    width={500}
                    height={300}
                    style={{
                      width: '100%',
                      height: 'auto',
                    }}
                  />
                </div>
              )}

              <div className="mt-4">
                <h2 className="text-2xl font-bold italic">
                  {burger.burgerName}
                </h2>
                {burger.notes ? (
                  <p className="my-4 pe-4 text-lg">{burger.notes}</p>
                ) : null}
                <Divider />
                <h2 className="mb-1 text-2xl font-extrabold">Rating</h2>
                <FieldSet>
                  <div className="md:w-1/2">
                    <Label id="appearance">Appearance</Label>
                    <StarRating id="appearance" rating={burger.appearance}>
                      How was the presentation of the burger? Perfectly crafted?
                      Shoved into a fast food wrapper?
                    </StarRating>
                  </div>
                  <div className="mt-3 md:mt-0 md:w-1/2">
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
                  <div className="md:w-1/2">
                    <Label id="meat">Meat</Label>
                    <StarRating id="meat" rating={burger.meat}>
                      The burger itself. This category covers flavor, texture,
                      juiciness, and done-ness.
                    </StarRating>
                  </div>
                  <div className="mt-3 md:mt-0 md:w-1/2">
                    <Label id="cheese">Cheese</Label>
                    <StarRating id="cheese" rating={burger.cheese}>
                      How was the cheese? Meltiness, quality, quantity, etc.
                    </StarRating>
                  </div>
                </FieldSet>
                <FieldSet>
                  <div className="md:w-1/2">
                    <Label id="veg">Vegetables</Label>
                    <StarRating id="veg" rating={burger.veg}>
                      This covers lettuce, onion, tomato, pickle, peppers,
                      kimchi, and anything else that might be used to dress up
                      the burger in question.
                    </StarRating>
                  </div>
                  <div className="my-4 md:mt-0 md:w-1/2">
                    <Label id="sauce">Sauces</Label>
                    <StarRating id="sauce" rating={burger.sauce}>
                      Ketchup, mustard, aoli, peanut butter, special sauce, or
                      anything spreadable on the burger.
                    </StarRating>
                  </div>
                </FieldSet>
                <h2 className="mt-5 text-2xl font-bold">Miscellaneous</h2>
                <FieldSet>
                  <div className="md:w-1/2">
                    <Label id="venue">Cook Type</Label>
                    <p className="py-2">{burger.cookType || 'Unknown'}</p>
                  </div>
                  <div className="mt-4 md:mt-0 md:w-1/2">
                    <Label id="address">Price</Label>
                    <StarRating id="price" rating={burger.price} isValue>
                      <p>Price level. Does not affect the rating.</p>
                      <ul className="lg:flex lg:gap-4">
                        <li className="flex items-center">
                          <div className="mr-2 mt-1 text-orange-500">
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                          </div>
                          <span>$1-5</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-orange-500">
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                          </div>
                          <span>$5-12</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-orange-500">
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                          </div>
                          <span>$12-20</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-orange-500">
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                          </div>
                          <span>$20-40</span>
                        </li>
                        <li className="flex items-center">
                          <div className="mr-2 text-orange-500">
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                            <FontAwesomeIcon icon={faDollarSign} size="sm" />
                          </div>
                          <span>&gt; $40</span>
                        </li>
                      </ul>
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
