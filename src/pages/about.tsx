import type { NextPage } from 'next';
import Image from 'next/image';
import Head from 'next/head';

import { Layout } from 'layout';

const About: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>About BurgerTime :: BurgerTime</title>
      </Head>
      <main className="p-4">
        <div className="container mx-auto flex flex-col">
          <div className="my-5">
            <h1 className="text-3xl">What is this?</h1>
            <p>It lets you rate the burgers you eat, duh.</p>
          </div>
          <div className="mb-5">
            <h1 className="text-3xl">Why did you make this?</h1>
            <p className="mb-2">
              I eat a lot of burgers. It&apos;s my favorite food. This means I
              eat from lots of different places, and I don&apos;t remember all
              of them.
            </p>
            <p>
              I&apos;m also a programmer, so I can spin up a website really
              quick. Combine a love of tech, burgers, and data and you get
              BurgerTime.
            </p>
          </div>
          <div className="mb-5">
            <h1 className="text-3xl">
              Did you name it after that old arcade game?
            </h1>
            <Image
              src="/burgertimegame.png"
              alt="Burger Time Arcade Game"
              width={300}
              height={300}
              priority
            />
            <p>Yep.</p>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default About;
