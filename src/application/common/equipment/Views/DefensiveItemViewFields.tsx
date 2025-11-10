"use client";

import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
import SummaryView from "@/application/common/SummaryView";
import { type Armor } from '@/domain/characters/equipment/Armor';
import { type Shield } from '@/domain/characters/equipment/Shield';
import { ReactNode } from 'react';
import { resistanceIcon } from '@/presentation/icons';

type DefensiveItemViewFieldsProps =
{
  item: Armor | Shield;
  specificBadges: ReactNode;
  compact?: boolean;
}

export default function DefensiveItemViewFields({ item, specificBadges, compact = false }: DefensiveItemViewFieldsProps)
{
  return (
    <div className='flex flex-col w-full gap-3'>
      <div className='flex flex-row place-items-center justify-between w-full gap-4'>

        <SummaryView entity={item} />

        <div className="flex flex-row place-items-center gap-2">
          {specificBadges}

          {
            item.resistance > 0 && (
                <Badge variant="secondary" className="h-9 px-2">
                    <div>{resistanceIcon("h-5 w-5")}</div>
                    <div className="ml-1">{item.resistance}</div>
                </Badge>
            )
          }

        </div>
      </div>

      { !compact && <ExtendedViewFields item={item} /> }
    </div>
  );
}

function ExtendedViewFields({ item }: { item: Armor | Shield })
{
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 px-2 py-2 bg-muted/30 rounded-md">
        <div className="flex flex-row gap-1 place-items-center">
          <span className='text-xs font-semibold capitalize text-muted-foreground'>{displayedText.attributePenalty}:</span>
          <span className="text-xs font-medium">{item.attributePenalty}</span>
        </div>

        <div className="flex flex-row gap-1 place-items-center">
          <span className='text-xs font-semibold capitalize text-muted-foreground'>{displayedText.strengthRequirement}:</span>
          <span className="text-xs font-medium">{item.strengthRequirement}</span>
        </div>

        <div className="flex flex-row gap-1 place-items-center">
          <span className='text-xs font-semibold capitalize text-muted-foreground'>{displayedText.dexterityRestriction}:</span>
          <span className="text-xs font-medium">{item.dexterityRestriction}</span>
        </div>

        <div className="flex flex-row gap-1 place-items-center">
          <span className='text-xs font-semibold capitalize text-muted-foreground'>{displayedText.initiativeRestriction}:</span>
          <span className="text-xs font-medium">{item.initiativeRestriction}</span>
        </div>
      </div>
  )
}