import { Card, Col, Divider, Row, Space, Typography } from 'antd';
import BurgerPhoto from 'components/BurgerPhoto';
import { DocumentData } from 'firebase/firestore';

import BurgerRateField from 'components/BurgerRateField';
import BurgerPriceLegend from 'components/BurgerForm/BurgerPriceLegend';
import { BURGER_RATING_FIELDS } from 'components/BurgerForm/burgerFormCopy';
import LocationLink from 'components/LocationLink';
import ScoreBadge from 'components/ScoreBadge';
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
              <Space orientation="vertical" size="small" className="w-full">
                <Typography.Title
                  level={1}
                  className="font-venue mb-0! text-brand-700!"
                >
                  {burger.venue}
                </Typography.Title>
                {timestampDate ? (
                  <time
                    className="block font-sans text-xs text-stone-500"
                    dateTime={timestampISO}
                  >
                    {getFormattedDate(timestampDate)}
                  </time>
                ) : null}
                <Divider className="my-0!" />
                <LocationLink burger={locationBurger} />
              </Space>
            </Col>
            <Col flex="none">
              <ScoreBadge score={score} />
            </Col>
          </Row>
        </div>
        {burger.image ? (
          <div className="relative aspect-5/3 w-full bg-stone-100">
            <BurgerPhoto
              src={burger.image}
              alt={burger.burgerName}
              layout="detail"
              priority
            />
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
                      <BurgerRateField disabled value={burger[field.key] ?? 0}>
                        {field.description}
                      </BurgerRateField>
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
