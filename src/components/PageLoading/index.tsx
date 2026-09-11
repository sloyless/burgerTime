import Loader from 'components/Loader';

type Props = {
  tip?: string;
};

function PageLoading({ tip }: Readonly<Props>) {
  return <Loader message={tip} minHeight="30vh" />;
}

export default PageLoading;
