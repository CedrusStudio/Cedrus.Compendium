"use client";

import { Badge } from "@/common/components/ui/badge";
import { getBadgeVariant, getCastTimeColors } from "@/common/colors";
import { displayedText } from "@/common/translations";
import { allowedCastTimes, type CastTime } from "@/domain/characters/Castable";
import { cn } from "@/lib/utils";

type CastTimeFilterProps =
{
  selectedCastTimes: CastTime[];
  onSelectedCastTimesChange: (castTimes: CastTime[]) => void;
}

export default function CastTimeFilter({ selectedCastTimes, onSelectedCastTimesChange }: CastTimeFilterProps)
{
  const clearSelection = () =>
  {
    if (selectedCastTimes.length === 0)
    {
      return;
    }

    onSelectedCastTimesChange([]);
  };

  const toggleCastTime = (castTime: CastTime) =>
  {
    if (selectedCastTimes.includes(castTime))
    {
      onSelectedCastTimesChange(selectedCastTimes.filter(selected => selected !== castTime));
      return;
    }

    onSelectedCastTimesChange([...selectedCastTimes, castTime]);
  };

  const isAllSelected = selectedCastTimes.length === 0;

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-2 self-center">
      <Badge
        asChild
        variant={isAllSelected ? "secondary" : "outline"}
        className={cn("min-h-9 px-3 py-1 leading-none", !isAllSelected && "text-muted-foreground")}
      >
        <button type="button" onClick={clearSelection} aria-pressed={isAllSelected}>
          {displayedText.all}
        </button>
      </Badge>

      {
        allowedCastTimes.map(castTime =>
        {
          const isSelected = selectedCastTimes.includes(castTime);
          const badgeVariant = getBadgeVariant(castTime);
          const castTimeColors = getCastTimeColors(castTime);

          return (
            <Badge
              key={castTime}
              asChild
              variant={isSelected ? badgeVariant : "outline"}
              className={cn(
                "min-h-9 px-3 py-1 leading-none transition-opacity",
                !isSelected && ["border-current bg-transparent", castTimeColors.text, "hover:opacity-80"]
              )}
            >
              <button type="button" onClick={() => toggleCastTime(castTime)} aria-pressed={isSelected}>
                {castTime}
              </button>
            </Badge>
          );
        })
      }
    </div>
  );
}