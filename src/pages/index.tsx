import type { NextPage } from 'next';
import { useAuth } from 'context/AuthContext';
import { useRouter } from 'next/router';

import { Layout } from 'layout';

const Home: NextPage = () => {
  const { login } = useAuth();
  const router = useRouter();

  async function loginUser() {
    try {
      await login();
      await router.push('/dashboard');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Layout>
      <main className="p-4">
        <div className="container mx-auto flex flex-col">
          <h1 className="text-center text-2xl">BurgerTime 🍔</h1>
          <p className="mt-4 text-center text-lg">
            I&apos;ll gladly pay you Tuesday for a Hamburger today...
          </p>
          <button role="button" className="mt-5" onClick={() => loginUser()}>
            Login
          </button>
        </div>
      </main>
    </Layout>
  );
};

export default Home;
