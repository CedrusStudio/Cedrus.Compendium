"use client";

import { PowerSpecification } from '@/domain/characters/combat/Power';
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';
import { colors } from '@/common/colors';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { costIcon, leftIcon, rightIcon } from '@/common/icons';

type PowerOffenseSelectorProps = 
{
  powerSpecification: PowerSpecification;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onUseSelectedOffense?: (index: number) => void;
  isUseDisabled?: boolean;
  useButtonLabel?: string;
};

export default function PowerOffenseSelector({ powerSpecification, selectedIndex, onSelectIndex, onUseSelectedOffense, isUseDisabled = false, useButtonLabel }: PowerOffenseSelectorProps) 
{
  const offenses = powerSpecification.offenses;
  const maxIndex = offenses.length - 1;
  const currentIndex = Math.min(selectedIndex, maxIndex);
  const offense = offenses[currentIndex];

  if (!offense) return null;

  const attackString = toOffenseString(offense.spellOffense);
  const damageString = toOffenseString(offense.spellDamage, true);
  const criticalString = `${toCriticalRangeString(offense.spellOffense)}, ${offense.spellOffense.critical.power >= 0 ? "+" : ""}${offense.spellOffense.critical.power}`;

  const handlePrevious = () => 
  {
    if (currentIndex > 0) 
    {
      onSelectIndex(currentIndex - 1);
    }
  };

  const handleNext = () => 
  {
    if (currentIndex < maxIndex) 
    {
      onSelectIndex(currentIndex + 1);
    }
  };

  const costBadge = (
    <Badge variant="cost" className="h-8 w-20">
      {costIcon}
      <span className="ml-1">{offense.cost}</span>
    </Badge>
  );

  return (
    <div className="mt-4 pt-2 lg:mt-0 lg:pt-0 border-t border-border/40 lg:border-0">
      <div className="flex flex-col gap-3 p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          {
            offense.description && <p className="text-sm text-muted-foreground">{offense.description}</p>
          }

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-8 w-8"
            >
              {leftIcon}
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {currentIndex + 1} / {maxIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === maxIndex}
              className="h-8 w-8"
            >
              {rightIcon}
            </Button>
          </div>
        </div>

        <div className="flex flex-row place-content-center gap-2">

          <div className="flex flex-wrap gap-2 items-center justify-center">

            <Badge variant="outline" className="font-mono">
              <span className={colors.offense.leading}>{attackString}</span>
              {damageString && <Badge variant="secondary" className="ml-1">{damageString}</Badge>}
            </Badge>

            <Badge variant="secondary" className="font-mono text-xs">
              {criticalString}
            </Badge>

            {
              onUseSelectedOffense
                ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 p-0"
                    onClick={() => onUseSelectedOffense(currentIndex)}
                    disabled={isUseDisabled}
                    aria-label={useButtonLabel}
                    title={useButtonLabel}
                  >
                    {costBadge}
                  </Button>
                )
                : costBadge
            }

          </div>
        </div>
      </div>
    </div>
  );
}