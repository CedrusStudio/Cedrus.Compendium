import { Badge } from '@/common/components/ui/badge';
import { priceIcon } from '@/common/icons';

type PriceBadgeProps = 
{
  price: number;
};

export default function PriceBadge({ price }: PriceBadgeProps) 
{
  return (
    <Badge variant="secondary" className="h-9 w-11 capitalize">
      <div>{priceIcon}</div>
      <div>{price}</div>
    </Badge>
  );
}
