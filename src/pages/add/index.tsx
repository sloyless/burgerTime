import { FormEvent, useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

// Functions
import { getFile, uploadFile } from 'libs/storage';
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
import BurgerRules from 'components/BurgerRules';
import Loader from 'components/Loader';
import Spinner from 'components/Loader/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

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
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [uploadedFile, setUploadedFile] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  // Form Fields
  const venueInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const burgerNameInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const cookInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateScoreHandler() {
    const newBurger = {
      appearance,
      bun,
      cheese,
      meat,
      sauce,
      veg,
      image: uploadedFile,
    };
    setScore(calculateScore(newBurger));
  }

  useEffect(() => {
    updateScoreHandler();
  }, [appearance, bun, cheese, meat, sauce, veg]);

  const handleUpload = async () => {
    setIsUploading(true);
    const folder = 'burgers/';
    const imagePath = await uploadFile(selectedFile, folder);
    const imageUrl = await getFile(imagePath);
    setIsUploading(false);
    setIsUploaded(true);
    setUploadedFile(imageUrl);
  };

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
    const image = uploadedFile;

    if (!venue || !address || !burgerName) return;

    const timestamp = serverTimestamp();
    const newBurger: Burger = {
      address,
      appearance,
      bun,
      burgerName,
      cheese,
      cookType,
      image,
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
      router.push(`/`);
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
                <div className="md:flex-1 md:flex-row">
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
                <div className="mt-3 md:mt-0 md:flex-1 md:flex-row">
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
                <div className="w-full">
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
                </div>
              </FieldSet>
              <FieldSet>
                <div className="md:flex md:flex-1">
                  <div className="w-full">
                    <Label id="venue">Upload Image</Label>
                    <Input
                      disabled={isUploading}
                      errorMessage="Please upload an image"
                      id="venue"
                      ref={fileInputRef}
                      type="file"
                      border={false}
                      onChange={(e) => {
                        setSelectedFile(e?.target?.files?.[0]);
                      }}
                    >
                      <div className="mt-3">
                        <Button
                          status={'primary'}
                          onClick={handleUpload}
                          disabled={isUploading}
                        >
                          Upload File
                        </Button>
                      </div>
                    </Input>
                  </div>
                </div>
                <div className="relative mt-3 lg:mt-0 xl:flex xl:flex-1">
                  {isUploading && <Spinner />}
                  {isUploaded && uploadedFile && (
                    <>
                      <Image
                        width={320}
                        height={120}
                        src={uploadedFile}
                        alt=""
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                        }}
                      />
                      {uploadedFile}
                    </>
                  )}
                </div>
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
                <div className="lg:w-1/2">
                  <div className="w-full md:mt-2 xl:w-[90px]">
                    <Label id="appearance">Appearance</Label>
                  </div>
                  <StarRating
                    id="appearance"
                    rating={appearance}
                    updateRating={setAppearance}
                    isEdit
                  >
                    How was the presentation of the burger? Perfectly crafted?
                    Shoved into a fast food wrapper?
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 lg:w-1/2">
                  <div className="w-full md:mt-2 lg:w-[90px]">
                    <Label id="bun">Bun</Label>
                  </div>

                  <StarRating
                    id="bun"
                    rating={bun}
                    updateRating={setBun}
                    isEdit
                  >
                    If a great burger is a classic painting, then the bun is the
                    frame. It&apos;s the handle. It&apos;s the rhythm section.
                    It&apos;s the wrapping that brings the whole thing together.
                  </StarRating>
                </div>
              </FieldSet>
              <FieldSet>
                <div className="lg:w-1/2">
                  <div className="w-full md:mt-2 lg:w-[90px]">
                    <Label id="meat">Meat</Label>
                  </div>

                  <StarRating
                    id="meat"
                    rating={meat}
                    updateRating={setMeat}
                    isEdit
                  >
                    The burger itself. This category covers flavor, texture,
                    juiciness, and done-ness.
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 lg:w-1/2">
                  <div className="w-full md:mt-2 lg:w-[90px]">
                    <Label id="cheese">Cheese</Label>
                  </div>
                  <StarRating
                    id="cheese"
                    rating={cheese}
                    updateRating={setCheese}
                    isEdit
                  >
                    How was the cheese? Meltiness, quality, quantity, etc.
                  </StarRating>
                </div>
              </FieldSet>
              <FieldSet>
                <div className="lg:w-1/2">
                  <div className="w-full lg:mt-2 lg:w-[90px]">
                    <Label id="veg">Vegetables</Label>
                  </div>
                  <StarRating
                    id="veg"
                    rating={veg}
                    updateRating={setVeg}
                    isEdit
                  >
                    This covers lettuce, onion, tomato, pickle, peppers, kimchi,
                    and anything else that might be used to dress up the burger
                    in question.
                  </StarRating>
                </div>
                <div className="mt-3 md:mt-0 lg:w-1/2">
                  <div className="w-full lg:mt-2 lg:w-[90px]">
                    <Label id="sauce">Sauces</Label>
                  </div>
                  <StarRating
                    id="sauce"
                    rating={sauce}
                    updateRating={setSauce}
                    isEdit
                  >
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
                <div className="lg:w-1/2">
                  <div className="w-full lg:w-[90px] lg:pr-3 xl:mt-2">
                    <Label id="venue">Cook Type</Label>
                  </div>
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
                <div className="mt-3 lg:mt-0 lg:w-1/2">
                  <Label id="address">Price</Label>
                  <StarRating
                    id="price"
                    rating={price}
                    updateRating={setPrice}
                    isEdit
                    isValue
                  >
                    Price level. Does not affect the rating.
                    <ul>
                      <li className="flex items-center">
                        <div className="mr-2 text-orange-500">
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
              <FieldSet>
                <div className="w-full lg:mt-2 lg:w-[90px]">
                  <Label id="notes">Notes</Label>
                </div>
                <Input id="notes" ref={notesInputRef} type="text">
                  Any additional information to share?
                </Input>
              </FieldSet>
              <div className="mt-5 w-auto text-center">
                <Button
                  type="button"
                  status="link"
                  onClick={() => router.push('/')}
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
        <BurgerRules />
      </main>
    </Layout>
  );
};

export default Add;
