import type { NextPage } from 'next';

import { Layout } from 'layout';

const Home: NextPage = () => {
  return (
    <Layout>
      <main className="p-4">
        <div className="container mx-auto flex flex-col">
          <p className="mt-4 text-center text-lg">
            I&apos;ll gladly pay you Tuesday for a Hamburger today...
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default Home;
