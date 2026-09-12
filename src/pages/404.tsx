import Link from 'next/link';
import type { NextPage } from 'next';
import { Result } from 'antd';

import PageMeta from 'components/PageMeta';
import { Layout } from 'layout';

const NotFoundPage: NextPage = () => (
  <Layout>
    <PageMeta title="Page not found" noIndex />
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <Result
        status="404"
        title="Page not found"
        subTitle="That burger review or page doesn’t exist."
        extra={
          <Link
            href="/"
            className="text-brand-700 hover:text-brand-800 font-medium"
          >
            Back to home
          </Link>
        }
      />
    </div>
  </Layout>
);

export default NotFoundPage;
