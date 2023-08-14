import Spinner from './Spinner';

type Props = {
  message?: string;
};

/**
 * LoadingPage
 * - Displays an Loading Spinner and message
 *
 * @component
 * @example
 * <LoadingPage message="Loading users" />
 *
 *  * @param {string} [message] - Message to override default loading message
 */
function Loader({ message }: Props) {
  return (
    <div className="mx-auto mt-10 w-[300px] text-center">
      <Spinner />
      <p className="heading-font mt-3 text-center font-bold">
        {message || 'Loading...'}
      </p>
    </div>
  );
}

export default Loader;
