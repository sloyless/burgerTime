import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons';

const PRICE_TIERS = [
  { count: 1, label: '$1-5' },
  { count: 2, label: '$5-12' },
  { count: 3, label: '$12-20' },
  { count: 4, label: '$20-40' },
  { count: 5, label: '> $40' },
] as const;

function BurgerPriceLegend() {
  return (
    <ul className="lg:flex lg:gap-4">
      {PRICE_TIERS.map((tier) => (
        <li key={tier.label} className="flex items-center">
          <div className="mr-2 text-orange-500">
            {Array.from({ length: tier.count }, (_, index) => (
              <FontAwesomeIcon key={index} icon={faDollarSign} size="sm" />
            ))}
          </div>
          <span>{tier.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default BurgerPriceLegend;
