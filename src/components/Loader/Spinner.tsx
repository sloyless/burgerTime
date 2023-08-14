import styles from './Spinner.module.css';

type Props = {
  reverse?: boolean;
};

/**
 * Spinner
 * - Pure CSS spinner
 *
 * @component
 * @example
 * <Spinner />
 *
 *  * @param {boolean} [reverse] - Message to override default loading message
 */
function Spinner({ reverse }: Props) {
  return (
    <div className={reverse ? styles.ldsringrev : styles.ldsring}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

export default Spinner;
