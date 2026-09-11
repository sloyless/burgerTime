import Image from 'next/image';

import Button from 'components/Button';
import DatePicker from 'components/Forms/DatePicker';
import FieldSet from 'components/Forms/FieldSet';
import {
  formAddressInputClass,
  formBurgerNameInputClass,
  formControlClass,
  formDateInputClass,
  formNotesTextareaClass,
  formVenueInputClass,
} from 'components/Forms/formStyles';
import Input from 'components/Forms/Input';
import Label from 'components/Forms/Label';
import TextArea from 'components/Forms/TextArea';
import TextField from 'components/Forms/TextField';
import ScoreBadge from 'components/ScoreBadge';
import StarRating from 'components/StarRating';
import Spinner from 'components/Loader/Spinner';
import Divider from 'components/Divider';

import BurgerPriceLegend from './BurgerPriceLegend';
import { BURGER_RATING_FIELDS } from './burgerFormCopy';
import { BurgerFormValues, BurgerRatingKey } from './types';

type Props = {
  formClassName?: string;
  idPrefix?: string;
  isUploading: boolean;
  onSelectImage: (file: File | undefined) => void;
  onUploadImage: () => void;
  score: number;
  selectedFile?: File;
  setField: <K extends keyof BurgerFormValues>(
    key: K,
    value: BurgerFormValues[K]
  ) => void;
  setRating: (key: BurgerRatingKey, rating: number) => void;
  showRatingIntro?: boolean;
  values: BurgerFormValues;
};

function BurgerForm({
  formClassName = '',
  idPrefix = '',
  isUploading,
  onSelectImage,
  onUploadImage,
  score,
  selectedFile,
  setField,
  setRating,
  showRatingIntro = false,
  values,
}: Readonly<Props>) {
  const id = (name: string) => `${idPrefix}${name}`;

  const ratingPairs = [
    [BURGER_RATING_FIELDS[0], BURGER_RATING_FIELDS[1]],
    [BURGER_RATING_FIELDS[2], BURGER_RATING_FIELDS[3]],
    [BURGER_RATING_FIELDS[4], BURGER_RATING_FIELDS[5]],
  ] as const;

  return (
    <div className={`min-w-0 max-w-full ${formClassName}`}>
      <div className="flex min-w-0 flex-row">
        <div className="min-w-0 flex-1 pr-5">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <label htmlFor={id('venue')} className="sr-only">
                Venue Name
              </label>
              <input
                id={id('venue')}
                type="text"
                required
                value={values.venue}
                onChange={(e) => setField('venue', e.target.value)}
                placeholder="Venue name"
                className={formVenueInputClass}
              />
            </div>
            <div className="shrink-0 lg:pb-1 lg:pl-3">
              <label htmlFor={id('review-date')} className="sr-only">
                Review Date
              </label>
              <DatePicker
                id={id('review-date')}
                required
                value={values.reviewDate}
                onChange={(value) => setField('reviewDate', value)}
                inputClassName={formDateInputClass}
                wrapperClassName="w-auto min-w-[9.5rem]"
              />
            </div>
          </div>
          <hr className="my-1 w-full" />
          <label htmlFor={id('address')} className="sr-only">
            Location
          </label>
          <TextField
            id={id('address')}
            required
            value={values.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Address or city & state"
            inputClassName={formAddressInputClass}
          />
        </div>
        <ScoreBadge score={score} />
      </div>

      <div className="mt-4">
        {isUploading && <Spinner />}
        {values.image && !isUploading && (
          <Image
            width={500}
            height={300}
            src={values.image}
            alt={values.burgerName || 'Burger'}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
        <div className="mt-3 rounded border border-dashed border-slate-300 p-3">
          <Label id={id('image')}>Photo</Label>
          <Input
            disabled={isUploading}
            id={id('image-file')}
            type="file"
            border={false}
            onChange={(e) => onSelectImage(e?.target?.files?.[0])}
          >
            <div className="mt-2">
              <Button
                status="primary"
                type="button"
                onClick={onUploadImage}
                disabled={isUploading || !selectedFile}
              >
                Upload File
              </Button>
            </div>
          </Input>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={id('burgerName')} className="sr-only">
          Burger Name
        </label>
        <input
          id={id('burgerName')}
          type="text"
          required
          value={values.burgerName}
          onChange={(e) => setField('burgerName', e.target.value)}
          placeholder="Burger name"
          className={formBurgerNameInputClass}
        />
        <label htmlFor={id('notes')} className="sr-only">
          Notes
        </label>
        <TextArea
          id={id('notes')}
          value={values.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Notes about this burger..."
          className={formNotesTextareaClass}
        />
      </div>

      <Divider />
      <h2 className="mb-1 text-2xl font-extrabold">Rating</h2>
      {showRatingIntro ? (
        <p className="mb-3 text-sm text-slate-600 md:text-base">
          Rate each category on a 5-star scale.
        </p>
      ) : null}

      {ratingPairs.map((pair, rowIndex) => (
        <FieldSet key={rowIndex}>
          {pair.map((field, columnIndex) => (
            <div
              key={field.key}
              className={
                columnIndex === 1
                  ? 'mt-3 md:mt-0 md:w-1/2'
                  : 'md:w-1/2'
              }
            >
              <Label id={id(field.key)}>{field.label}</Label>
              <StarRating
                id={id(field.key)}
                rating={values[field.key]}
                updateRating={(rating) => setRating(field.key, rating)}
                isEdit
              >
                {field.description}
              </StarRating>
            </div>
          ))}
        </FieldSet>
      ))}

      <h2 className="mt-5 text-2xl font-bold">Miscellaneous</h2>
      <FieldSet>
        <div className="md:w-1/2">
          <Label id={id('cookType')}>Cook Type</Label>
          <TextField
            id={id('cookType')}
            value={values.cookType}
            onChange={(e) => setField('cookType', e.target.value)}
            placeholder="Grill"
            inputClassName={formControlClass}
          />
        </div>
        <div className="mt-4 md:mt-0 md:w-1/2">
          <Label id={id('price')}>Price</Label>
          <StarRating
            id={id('price')}
            rating={values.price}
            updateRating={(rating) => setField('price', rating)}
            isEdit
            isValue
          >
            <p>Price level. Does not affect the rating.</p>
            <BurgerPriceLegend />
          </StarRating>
        </div>
      </FieldSet>
    </div>
  );
}

export default BurgerForm;
