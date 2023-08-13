import { useContext, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

import { Layout } from 'layout';
import { useAuth } from 'context/AuthContext';
import { database } from 'utils/firebase';
import { Burger } from 'utils/types';

const Dashboard: NextPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  console.log(user);

  // Get data if user set or changed
  useEffect(() => {
    setLoading(true);

    if (user) {
      // Get real-time data to monitor collection changes
      const dbInstance = query(
        collection(database, 'burgers'),
        where('userId', '==', user.uid)
      );
      const unsub = onSnapshot(dbInstance, (docs) => {
        const matchedItems:
          | ((prevState: never[]) => never[])
          | { id: string }[] = [];
        docs.forEach((doc) => {
          // onSnapshot does not return ids
          const item = {
            ...doc.data(),
            id: doc.id,
          };
          matchedItems.push(item);
        });
        setItems(matchedItems);

        // Get other static collections
        setLoading(false);
      });

      return () => {
        unsub;
      };
    }
  }, [user]);

  return (
    <Layout user={user}>
      <Head>
        <title>Your Dashboard :: BurgerTime</title>
      </Head>
      <main className="p-4">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-center text-2xl">Your Dashboard</h1>
        </div>
        {items.map((item: Burger, i: number) => {
          if (!item) return;

          return (
            <div key={item.id}>
              <div>{item.venue}</div>
              <div>{item.address}</div>
            </div>
          );
        })}
      </main>
    </Layout>
  );
};

export default Dashboard;
