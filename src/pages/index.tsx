import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Image from 'next/image';
import { collection, orderBy, onSnapshot, query } from 'firebase/firestore';
import { Layout } from 'layout';
import Divider from 'components/Divider';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';
import logo from 'components/NavBar/assets/logo.png';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

const Home: NextPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Burger[]>();

  // Get data if user set or changed
  useEffect(() => {
    if (!items) {
      // Get real-time data to monitor collection changes
      const dbInstance = query(
        collection(database, 'burgers'),
        orderBy('timestamp', 'desc')
      );
      const unsub = onSnapshot(dbInstance, (docs) => {
        const matchedItems: Burger[] = [];
        docs.forEach((doc) => {
          // onSnapshot does not return ids
          const item = {
            ...doc.data(),
            id: doc.id,
          };
          matchedItems.push(item);
        });
        setItems(matchedItems);
        setLoading(false);
      });

      return () => {
        unsub();
      };
    }
  }, [items, loading]);

  const getTopTenBurgers = (burgers: Burger[]) => {
    const topTen: Burger[] = burgers.toSorted((a, b) => {
      if (a.total && b.total) {
        return b.total - a.total;
      } else {
        return 0;
      }
    });
    return topTen.slice(0, 10);
  };

  let content;
  if (loading) {
    content = <div>Loading...</div>;
  } else if (!loading && items?.length) {
    const topTenBurgers = getTopTenBurgers(items);

    content = (
      <>
        <div className="mx-auto lg:flex lg:flex-[9] lg:flex-col lg:pr-8">
          <section>
            <div className="mb-5 flex flex-row items-center">
              <div className="flex-1 border-b-2 border-orange-600 pr-7" />
              <h2 className="px-3 text-center text-2xl font-extrabold lg:flex-[2] lg:text-4xl">
                Latest Reviews
              </h2>
              <div className="flex-1 border-b-2 border-orange-600 pr-7" />
            </div>
            {items?.map((item, i) => {
              if (!item) return null; // skip most recent review

              return (
                <>
                  <Card
                    featured={i === 0}
                    burger={item}
                    key={item.id}
                    url={`/burger/${item.id}`}
                  />
                  {(i === 0 || i < items.length - 1) && (
                    <div className="mb-6">
                      <Divider />
                    </div>
                  )}
                </>
              );
            })}
          </section>
        </div>
        <aside className="mt-2 lg:flex lg:flex-[3]">
          <div className="block">
            <h3 className="text-xl font-extrabold">
              <span className="inline-block pr-1">
                <FontAwesomeIcon
                  icon={faStar}
                  size="sm"
                  className="w-[16px] text-amber-500"
                />
              </span>
              Top 10 All-Time
            </h3>
            <ol className="list-decimal">
              {topTenBurgers.map((burger) => {
                return (
                  <li key={burger.id} className="my-2 ml-7 w-full">
                    <Link
                      href={`/burger/${burger.id}`}
                      className="text-orange-600 hover:text-orange-500"
                    >
                      <h3 className="font-bold leading-4">{burger.venue}</h3>
                      <small className="line-clamp-1 text-black">
                        {burger.address}
                      </small>
                    </Link>
                  </li>
                );
              })}
            </ol>
            <Divider />
          </div>
        </aside>
      </>
    );
  } else {
    content = (
      <div className="mx-auto text-center">
        <Image
          className="mx-auto my-5"
          width={120}
          src={logo}
          alt=""
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <EmptyState message="Rate some burgers!" title="No Burgers Found" />
      </div>
    );
  }

  return (
    <Layout>
      <header className="pt-8 text-center">
        <h1 className="mb-4 text-3xl font-extrabold leading-none tracking-tight text-orange-600 md:text-4xl lg:text-5xl">
          Welcome to BurgerTime
        </h1>
        <p className="mb-3 text-lg sm:px-16 lg:px-48 lg:text-xl">
          One man&apos;s journey to eat every cheeseburger in the world.{' '}
          <em>
            <small>(Mostly NYC)</small>
          </em>
        </p>
        <Link className="text-orange-600 hover:text-orange-500" href={`/about`}>
          [Read More]
        </Link>
      </header>
      <Divider />
      <main className="pt-6 lg:flex lg:flex-row">{content}</main>
    </Layout>
  );
};

export default Home;
