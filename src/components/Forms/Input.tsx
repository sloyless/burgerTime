/* eslint-disable react/display-name */
import {
  ChangeEventHandler,
  ForwardedRef,
  forwardRef,
  ReactNode,
  useEffect,
  useState,
} from 'react';

type Props = {
  children?: ReactNode;
  border?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  id: string;
  min?: string;
  max?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  pattern?: string;
  placeholder?: string;
  required?: boolean;
  type: string;
  value?: string;
};

const Input = forwardRef(
  (props: Props, ref: ForwardedRef<HTMLInputElement>) => {
    const {
      children,
      border = true,
      disabled,
      errorMessage,
      id,
      min,
      max,
      onChange,
      pattern,
      placeholder,
      required,
      type,
      value,
    } = props;

    // Assign input props and forwardedRef
    const inputProps = {
      disabled,
      id,
      min,
      max,
      onChange,
      pattern,
      placeholder,
      required,
      ref,
      type,
    };
    const [hasValue, setHasValue] = useState<boolean | undefined>(false);
    const [isValid, setIsValid] = useState<boolean | undefined>(false);
    const [isRequired, setIsRequired] = useState<boolean | undefined>(false);

    useEffect(() => {
      if (!!ref && typeof ref !== 'function') {
        setHasValue(!!ref?.current?.value);
        setIsValid(ref.current?.validity.valid);
        setIsRequired(ref.current?.required);
      }
    }, [ref]);

    const getBorderClasses = () => {
      if (border) {
        return `border border-slate-400 ${
          hasValue ? 'invalid:border-red-600' : ''
        }`;
      }
    };

    return (
      <div className="w-full">
        <input
          aria-describedby={children ? `${id}Help` : ''}
          className={`w-full px-3 py-2 text-slate-700 ${getBorderClasses()} disabled:bg-slate-400 disabled:text-slate-700`}
          defaultValue={value}
          {...inputProps}
        />
        {children ? (
          <small className="block pt-1 text-slate-600" id={`${id}Help`}>
            {children}
          </small>
        ) : null}
        {hasValue && !isValid && isRequired ? ( // Display error messages for req and filled out fields
          <small className="block pt-1 text-red-600" id={`${id}Error`}>
            {errorMessage}
          </small>
        ) : null}
      </div>
    );
  }
);

export default Input;
