type Props = {
  message?: string;
  title?: string;
};

/**
 * EmptyState
 * - Displays a stylized container displaying an error message
 *
 * @component
 * @example
 * <EmptyState message="Error loading collection" />
 *
 *  * @param {string} [message] - Message to override default loading message
 *  * @param {string} [title] - Heading title of the state
 */
function EmptyState({ message, title }: Readonly<Props>) {
  return (
    <div className="mx-auto mt-10 w-[300px] text-center">
      <h2 className="text-2xl font-bold text-red-600">{title || 'Error'}</h2>
      <p className="my-3 text-center font-bold">
        {message || 'Encountered an error.'}
      </p>
    </div>
  );
}

export default EmptyState;
