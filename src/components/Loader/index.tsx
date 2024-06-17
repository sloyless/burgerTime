import Spinner from './Spinner';

type Props = {
  message?: string;
  width?: string;
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
function Loader({ message, width = '300px' }: Props) {
  return (
    <div className={`mx-auto mt-10 w-[${width}] text-center`}>
      <Spinner />
      <p className="mt-3 text-center font-bold">{message || 'Loading...'}</p>
    </div>
  );
}

export default Loader;
