import { Card, Col, Divider, Row, Space, Typography } from 'antd';
import BurgerPhoto from 'components/BurgerPhoto';
import { DocumentData } from 'firebase/firestore';

import BurgerRateField from 'components/BurgerRateField';
import BurgerPriceLegend from 'components/BurgerForm/BurgerPriceLegend';
import {
  BURGER_RATING_FIELDS,
  burgerOptionalRatingNaField,
} from 'components/BurgerForm/burgerFormCopy';
import LocationLink from 'components/LocationLink';
import ScoreBadge from 'components/ScoreBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { calculateTimestamp, getFormattedDate } from 'functions';
import { Burger } from 'utils/types';
import { STACK_SPACE_CLASSNAME } from 'theme/layout';

type Props = {
  burger: DocumentData;
  score: number;
};

function BurgerDetailView({ burger, score }: Readonly<Props>) {
  const timestampDate = calculateTimestamp(burger?.timestamp?.seconds);
  const timestampISO = timestampDate?.toISOString();
  const locationBurger = burger as Burger;

  const ratingPairs = [
    [BURGER_RATING_FIELDS[0], BURGER_RATING_FIELDS[1]],
    [BURGER_RATING_FIELDS[2], BURGER_RATING_FIELDS[3]],
    [BURGER_RATING_FIELDS[4], BURGER_RATING_FIELDS[5]],
  ] as const;

  function isRatingNotApplicable(key: string) {
    const naField = burgerOptionalRatingNaField(key);
    if (!naField) return false;
    return Boolean(locationBurger[naField]);
  }

  return (
    <Space
      orientation="vertical"
      size="large"
      className={STACK_SPACE_CLASSNAME}
    >
      <Card
        className="overflow-hidden border-orange-200/80 shadow-sm"
        styles={{ body: { padding: 0 } }}
      >
        <div className="border-b border-orange-100/90 bg-linear-to-br from-brand-100/70 via-brand-50 to-white px-4 py-3 md:p-6">
          <Row gutter={16} align="top" wrap={false}>
            <Col flex="auto" className="min-w-0">
              <div className="flex w-full flex-col gap-1">
                <Typography.Title
                  level={1}
                  className="font-venue m-0! leading-tight text-brand-700!"
                >
                  {burger.venue}
                </Typography.Title>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <LocationLink
                    burger={locationBurger}
                    className="line-clamp-1 min-w-0 font-sans text-xs text-stone-600 hover:text-brand-700"
                  />
                  {timestampDate ? (
                    <>
                      <span className="text-stone-300" aria-hidden>
                        |
                      </span>
                      <time
                        className="shrink-0 font-sans text-xs text-stone-500"
                        dateTime={timestampISO}
                      >
                        {getFormattedDate(timestampDate)}
                      </time>
                    </>
                  ) : null}
                </div>
              </div>
            </Col>
            <Col flex="none" className="hidden md:block">
              <ScoreBadge score={score} />
            </Col>
          </Row>
          {!burger.image ? (
            <div className="mt-4 md:hidden">
              <ScoreBadge score={score} />
            </div>
          ) : null}
        </div>
        {burger.image ? (
          <div className="relative aspect-5/3 w-full bg-stone-100">
            <BurgerPhoto
              src={burger.image}
              alt={burger.burgerName}
              layout="detail"
              priority
            />
            <div className="absolute top-2 right-2 z-10 md:hidden">
              <ScoreBadge score={score} />
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="shadow-sm">
        <Space
          orientation="vertical"
          size="large"
          className={STACK_SPACE_CLASSNAME}
        >
          <div>
            <Typography.Title level={3} className="mt-0! font-serif! italic!">
              {burger.burgerName}
            </Typography.Title>
            {burger.notes ? (
              <Typography.Paragraph className="mb-0! text-lg text-stone-700">
                {burger.notes}
              </Typography.Paragraph>
            ) : null}
          </div>

          <Divider className="my-0!" />

          <div>
            <Typography.Title level={3} className="mt-0! font-serif!">
              Rating
            </Typography.Title>
            <Space orientation="vertical" size="small" className="w-full">
              {ratingPairs.map((pair, rowIndex) => (
                <Row gutter={[24, 16]} key={rowIndex}>
                  {pair.map((field) => (
                    <Col xs={24} md={12} key={field.key}>
                      <Typography.Text strong className="block">
                        {field.label}
                      </Typography.Text>
                      {isRatingNotApplicable(field.key) ? (
                        <p
                          className="mb-0! inline-flex items-center gap-2 text-sm text-stone-500"
                          title="Not on this burger"
                        >
                          <FontAwesomeIcon icon={faBan} className="size-4" />
                          <span>N/A</span>
                        </p>
                      ) : (
                        <BurgerRateField disabled value={burger[field.key] ?? 0}>
                          {field.description}
                        </BurgerRateField>
                      )}
                    </Col>
                  ))}
                </Row>
              ))}
            </Space>
          </div>

          <div>
            <Typography.Title level={3} className="mt-0! font-serif!">
              Miscellaneous
            </Typography.Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Space orientation="vertical" size={4}>
                  <Typography.Text strong>Cook type</Typography.Text>
                  <Typography.Paragraph className="mb-0! text-stone-700">
                    {burger.cookType || 'Unknown'}
                  </Typography.Paragraph>
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space orientation="vertical" size={4} className="w-full">
                  <Typography.Text strong>Price level</Typography.Text>
                  <BurgerRateField disabled isValue value={burger.price ?? 0}>
                    <p className="mb-0!">Does not affect the rating.</p>
                    <BurgerPriceLegend />
                  </BurgerRateField>
                </Space>
              </Col>
            </Row>
          </div>
        </Space>
      </Card>
    </Space>
  );
}

export default BurgerDetailView;
