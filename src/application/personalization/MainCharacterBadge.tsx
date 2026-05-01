import { Badge } from '@/common/components/ui/badge';
import { mainCharacterIcon } from '@/common/icons';

type MainCharacterBadgeProps = {
  characterLabel: string;
};

export default function MainCharacterBadge({ characterLabel }: MainCharacterBadgeProps)
{
  return (
    <Badge
      variant="secondary"
      className="h-7 min-w-7 rounded-full border-amber-400/50 bg-amber-100/80 p-0 text-amber-700 shadow-sm dark:bg-amber-500/20 dark:text-amber-200"
      title={`Główna postać ${characterLabel}`}
    >
      {mainCharacterIcon('h-3.5 w-3.5')}
      <span className="sr-only">Główna postać {characterLabel}</span>
    </Badge>
  );
}