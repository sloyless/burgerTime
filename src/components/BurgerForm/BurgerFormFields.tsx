import { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd';

import BurgerRateField from 'components/BurgerRateField';
import ScoreBadge from 'components/ScoreBadge';
import BurgerPhotoField from './BurgerPhotoField';
import BurgerPriceLegend from './BurgerPriceLegend';
import OptionalRatingFormItem from './OptionalRatingFormItem';
import {
  BURGER_RATING_FIELDS,
  burgerOptionalRatingNaField,
  cookTypeSelectOptions,
} from './burgerFormCopy';
import { STACK_SPACE_CLASSNAME } from 'theme/layout';

import { BurgerFormValues } from './types';

const ratingRule = (label: string) => ({
  validator: (_: unknown, value: number) =>
    value && value > 0
      ? Promise.resolve()
      : Promise.reject(new Error(`Please rate ${label.toLowerCase()}.`)),
});

type Props = {
  form: FormInstance<BurgerFormValues>;
  idPrefix?: string;
  imageUrl?: string;
  isUploading: boolean;
  onImageFile: (file: File) => Promise<void>;
  score: number;
  showRatingIntro?: boolean;
  onNotifyValuesChange?: () => void;
};

function BurgerFormFields({
  form,
  idPrefix = '',
  imageUrl,
  isUploading,
  onImageFile,
  score,
  showRatingIntro = false,
  onNotifyValuesChange,
}: Readonly<Props>) {
  const id = (name: string) => `${idPrefix}${name}`;
  const burgerName = Form.useWatch('burgerName', form);
  const cookType = Form.useWatch('cookType', form);
  const cookTypeOptions = useMemo(
    () => cookTypeSelectOptions(cookType),
    [cookType]
  );

  const ratingPairs = [
    [BURGER_RATING_FIELDS[0], BURGER_RATING_FIELDS[1]],
    [BURGER_RATING_FIELDS[2], BURGER_RATING_FIELDS[3]],
    [BURGER_RATING_FIELDS[4], BURGER_RATING_FIELDS[5]],
  ] as const;

  return (
    <Space
      orientation="vertical"
      size="large"
      className={STACK_SPACE_CLASSNAME}
    >
      <Card
        className="overflow-hidden shadow-sm"
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-6">
          <Row gutter={16} align="top" wrap={false}>
            <Col flex="auto" className="min-w-0">
              <Space orientation="vertical" size="middle" className="w-full">
                <Form.Item
                  name="venue"
                  label="Venue"
                  rules={[{ required: true, message: 'Enter a venue name.' }]}
                  className="mb-0! font-serif [&_.ant-form-item-label>label]:text-lg [&_.ant-form-item-label>label]:font-bold"
                >
                  <Input
                    id={id('venue')}
                    placeholder="Shake Shack"
                    variant="borderless"
                    className="font-venue px-0! text-2xl! text-orange-700! md:text-3xl!"
                  />
                </Form.Item>
                <Form.Item
                  name="reviewDate"
                  label="Review date"
                  rules={[{ required: true, message: 'Choose a date.' }]}
                  extra="Day you ate this burger (no time)."
                  className="mb-0! max-w-xs"
                  getValueFromEvent={(date: dayjs.Dayjs | null) =>
                    date ? date.format('YYYY-MM-DD') : ''
                  }
                  getValueProps={(value: string) => ({
                    value: value ? dayjs(value, 'YYYY-MM-DD') : undefined,
                  })}
                >
                  <DatePicker
                    id={id('review-date')}
                    className="w-full"
                    format="MMM D, YYYY"
                  />
                </Form.Item>
                <Form.Item
                  name="address"
                  label="Location"
                  rules={[{ required: true, message: 'Enter a location.' }]}
                  className="mb-0!"
                >
                  <Input
                    id={id('address')}
                    placeholder="51 Astor Place, New York, NY"
                  />
                </Form.Item>
              </Space>
            </Col>
            <Col flex="none">
              <ScoreBadge score={score} />
            </Col>
          </Row>
        </div>
        <BurgerPhotoField
          alt={burgerName || 'Burger'}
          imageUrl={imageUrl}
          isUploading={isUploading}
          onImageFile={onImageFile}
        />
      </Card>

      <Card className="shadow-sm">
        <Form.Item
          name="burgerName"
          label="Burger name"
          rules={[{ required: true, message: 'Enter the burger name.' }]}
          className="font-serif [&_.ant-form-item-label>label]:text-lg"
        >
          <Input
            id={id('burgerName')}
            placeholder="Shackburger"
            variant="borderless"
            className="px-0! text-xl! font-bold! italic! md:text-2xl!"
          />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea
            id={id('notes')}
            rows={4}
            placeholder="Tasting notes, sides, vibe..."
            showCount
            maxLength={2000}
          />
        </Form.Item>
      </Card>

      <Card className="shadow-sm">
        <Space
          orientation="vertical"
          size="large"
          className={STACK_SPACE_CLASSNAME}
        >
          <div>
            <Typography.Title level={3} className="mt-0! font-serif!">
              Rating
            </Typography.Title>
            {showRatingIntro ? (
              <Typography.Paragraph type="secondary">
                Rate each category on a 5-star scale. Use the{' '}
                <span className="whitespace-nowrap">N/A</span> control when
                cheese, vegetables, or sauces aren&apos;t on the burger.
              </Typography.Paragraph>
            ) : null}
            <Space orientation="vertical" size="small" className="w-full">
              {ratingPairs.map((pair, rowIndex) => (
                <Row gutter={[24, 16]} key={rowIndex}>
                  {pair.map((field) => (
                    <Col xs={24} md={12} key={field.key}>
                      {burgerOptionalRatingNaField(field.key) ? (
                        <OptionalRatingFormItem
                          field={field}
                          form={form}
                          naField={burgerOptionalRatingNaField(field.key)!}
                          onNotifyValuesChange={onNotifyValuesChange}
                          ratingRule={ratingRule}
                        />
                      ) : (
                        <Form.Item
                          name={field.key}
                          label={field.label}
                          rules={[ratingRule(field.label)]}
                        >
                          <BurgerRateField>{field.description}</BurgerRateField>
                        </Form.Item>
                      )}
                    </Col>
                  ))}
                </Row>
              ))}
            </Space>
          </div>

          <Divider className="my-0!" />

          <div>
            <Typography.Title level={3} className="mt-0! font-serif!">
              Miscellaneous
            </Typography.Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item name="cookType" label="Cook type">
                  <Select
                    id={id('cookType')}
                    allowClear
                    placeholder="Select cook type"
                    options={cookTypeOptions}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="price"
                  label="Price level"
                  className="[&_.ant-form-item-control]:max-w-none"
                >
                  <BurgerRateField isValue>
                    <p className="mb-0!">Does not affect the score.</p>
                    <BurgerPriceLegend />
                  </BurgerRateField>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Space>
      </Card>
    </Space>
  );
}

export default BurgerFormFields;
