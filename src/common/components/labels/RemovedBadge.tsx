import { Badge } from '@/common/components/ui/badge';
import { displayedText } from '@/common/translations';
import { cn } from '@/lib/utils';

type RemovedBadgeProps =
{
  className?: string;
};

export default function RemovedBadge({ className }: RemovedBadgeProps)
{
  return (
    <Badge variant="destructive" className={cn('capitalize', className)}>
      {displayedText.removed}
    </Badge>
  );
}