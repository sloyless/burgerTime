import type { NextPage } from 'next';
import Image from "next/image";

import { Layout } from 'layout';

const Home: NextPage = () => {
  return (
    <Layout>
      <main className="p-4">
        <div className="container mx-auto flex flex-col">
          <h1 className="mb-3 mt-4 text-3xl font-bold">
            It&apos;s BurgerTime!
          </h1>
          <div className="md:flex">
            <div className="relative mx-auto min-h-[200px] w-full md:w-1/4">
              <Image
                src="/squidward.gif"
                alt="Many burgers"
                fill
                priority
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "cover"
                }} />
            </div>
            <div className="w-full md:w-3/4 md:px-3">
              <h2 className="mb-3 text-xl font-bold">
                Do you like hamburgers?
              </h2>
              <p>
                BurgerTime is a catalog of all the burgers you eat. Enter the
                location, details about the burger, and rate it on a 6 point
                scale!
              </p>

              <h2 className="my-3 text-xl font-bold">Features:</h2>
              <ul className="list-disc">
                <li className="ms-5">
                  Dashboard featuring burgers sorted by recent.{' '}
                  <em>(Coming Soon: Sort by Score!)</em>
                </li>
                <li className="ms-5">
                  Add and review your burgers with a 6-pt scale.
                </li>
                <li className="ms-5">View your past burgers.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Home;
