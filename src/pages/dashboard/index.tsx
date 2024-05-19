import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Image from 'next/image';
import Head from 'next/head';
import {
  collection,
  orderBy,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { Layout } from 'layout';
import { useAuth } from 'context/AuthContext';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';
import Card from 'components/Card';
import EmptyState from 'components/EmptyState';

import logo from 'components/NavBar/assets/logo.png';
import Button from 'components/Button';

const Dashboard: NextPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Burger[]>();

  // Get data if user set or changed
  useEffect(() => {
    setLoading(true);

    if (user) {
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
  }, [user]);

  let content;
  if (loading) {
    content = <div>Loading...</div>;
  } else if (!loading && items?.length) {
    content = (
      <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items?.map((item) => {
          if (!item) return null;

          return (
            <Card burger={item} key={item.id} url={`/burger/${item.id}`} />
          );
        })}
      </section>
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
        <Button url="/add" status="primary">
          Add Burgers!
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Your Dashboard :: BurgerTime</title>
      </Head>
      <main className="flex-row">
        <div className="container mx-auto flex flex-initial flex-col">
          <h1 className="text-3xl">Your Dashboard</h1>
          {content}
        </div>
        <aside>Sidebar</aside>
      </main>
    </Layout>
  );
};

export default Dashboard;
