/**
 * Divider
 * - Displays a divider
 *
 * @component
 * @example
 * <EmptyState message="Error loading collection" />
 *
 *  * @param {string} [message] - Message to override default loading message
 *  * @param {string} [title] - Heading title of the state
 */
function Divider() {
  return (
    <div className="mx-auto my-5 h-2 w-full border-b-2 border-orange-500" />
  );
}

export default Divider;
