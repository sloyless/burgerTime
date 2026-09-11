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
  ADMINUID,
  calculateScore,
  calculateTimestamp,
  getFormattedDate,
} from 'functions';
import ScoreBadge from 'components/ScoreBadge';
import BurgerRules from 'components/BurgerRules';
import BurgerEditForm from 'components/BurgerEditForm';
import Button from 'components/Button';
import FieldSet from 'components/Forms/FieldSet';
import Label from 'components/Forms/Label';
import StarRating from 'components/StarRating';
import Divider from 'components/Divider';
import LocationLink from 'components/LocationLink';
import { useAuth } from 'context/AuthContext';

const BurgerPage: NextPage = () => {
  // Import in Router and Auth
  const router = useRouter();
  const { burgerID } = router.query;
  const { user } = useAuth();

  // Initialize state
  const [loading, setLoading] = useState(true);
  const [burger, setBurger] = useState<DocumentData>();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = user?.uid === ADMINUID;

  useEffect(() => {
    if (!burgerID || typeof burgerID !== 'string') {
      return;
    }

    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 10000);

    const dbInstance = doc(database, 'burgers', burgerID);
    const unsub = onSnapshot(
      dbInstance,
      (docData) => {
        window.clearTimeout(timeoutId);
        setBurger(docData.data());
        setLoading(false);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        console.error('Failed to load burger:', error);
        setLoading(false);
      }
    );

    return () => {
      window.clearTimeout(timeoutId);
      unsub();
    };
  }, [burgerID]);

  if (loading) return <div className="mt-5 pt-5">Loading...</div>;

  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();
  const score = burger
    ? burger.total ?? calculateScore(burger)
    : 100;

  // Page <head> props
  const pageTitle = `${burger?.venue ?? ''} - ${burger?.burgerName ?? ''} :: BurgerTime`;

  return (
    <Layout padding={false}>
      <Head>
        <title>{pageTitle} :: BurgerTime</title>
      </Head>
      <main className="min-w-0 px-3 md:flex md:px-0 md:pl-3 xl:flex-row">
        <div className="my-5 min-w-0 max-w-full md:mr-8">
          {burger ? (
            <>
              {isAdmin && !isEditing && (
                <div className="mb-4 text-end">
                  <Button
                    type="button"
                    status="primary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
              {isEditing && typeof burgerID === 'string' ? (
                <BurgerEditForm
                  burgerId={burgerID}
                  initial={burger}
                  onCancel={() => setIsEditing(false)}
                  onSaved={() => setIsEditing(false)}
                />
              ) : (
                <>
              <div className="flex min-w-0 flex-row">
                <div className="min-w-0 flex-1 pr-5">
                  <div className="flex min-w-0 flex-row items-end justify-between gap-2">
                    <h3 className="min-w-0 text-3xl font-extrabold break-words text-orange-600">
                      {burger.venue}
                    </h3>
                    <span className="hidden shrink-0 pb-1 pl-3 text-xs lg:block">
                      <time dateTime={timestampISO}>
                        {timestampDate && getFormattedDate(timestampDate)}
                      </time>
                    </span>
                  </div>
                  <hr className="my-1 w-full" />
                  <LocationLink burger={burger} />
                </div>
                <ScoreBadge score={score} />
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
                    <StarRating id="bun" rating={burger.bun}>
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
                          <div className="mt-1 mr-2 text-orange-500">
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
              )}
            </>
          ) : null}
        </div>
        <BurgerRules />
      </main>
    </Layout>
  );
};

export default BurgerPage;
