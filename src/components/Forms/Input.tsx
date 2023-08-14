/* eslint-disable react/display-name */
import {
  ChangeEventHandler,
  forwardRef,
  MutableRefObject,
  ReactNode,
} from 'react';

type Props = {
  children?: ReactNode;
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
  (props: Props, ref: MutableRefObject<HTMLInputElement>) => {
    const {
      children,
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
      ref,
      required,
      type,
    };
    const hasValue = !!ref.current?.value;
    const isValid = ref.current?.validity.valid;
    const isRequired = ref.current?.required;

    return (
      <div className="w-full md:w-2/3">
        <input
          aria-describedby={children ? `${id}Help` : ''}
          className={`w-full border border-slate-400 px-3 py-2 text-slate-700 ${
            hasValue ? 'invalid:border-red-600' : null
          } disabled:bg-slate-400 disabled:text-slate-700`}
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
