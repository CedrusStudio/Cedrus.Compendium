"use client";

import { Badge } from '@/common/components/ui/badge';
import SummaryView from "@/application/common/SummaryView";
import { type Armor } from '@/domain/characters/equipment/Armor';
import { type Shield } from '@/domain/characters/equipment/Shield';
import { ReactNode } from 'react';
import { attributePenaltyIcon, dexterityRestrictionIcon, initiativeRestrictionIcon, reflexRestrictionIcon, resistanceIcon, strengthRequirementIcon } from '@/presentation/icons';

type DefensiveItemViewFieldsProps =
{
  item: Armor | Shield;
  specificBadges: ReactNode;
  compact?: boolean;
}

export default function DefensiveItemViewFields({ item, specificBadges, compact = false }: DefensiveItemViewFieldsProps)
{
  return (
    <div className='flex flex-row place-items-center w-full gap-4'>

        <SummaryView entity={item} />
        { !compact && <ExtendedViewFields item={item} /> }

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
  );
}

function ExtendedViewFields({ item }: { item: Armor | Shield })
{
    return (
        <div className='flex flex-row  gap-2'>

        {
          item.attributePenalty > 0 && (
            <Badge variant="secondary" className='w-8 h-8 p-4 rounded-full'>
                <span className='text-xs font-semibold capitalize text-muted-foreground'>{attributePenaltyIcon()}</span>
                <span className="text-xs font-medium">{item.attributePenalty}</span>
            </Badge>
          )
        }

        <div className="flex flex-row gap-2 px-2 py-2 bg-muted/30 rounded-md w-fit">

            <div className="flex flex-row gap-1 place-items-center">
              <span className='text-xs font-semibold capitalize text-muted-foreground'>{reflexRestrictionIcon()}</span>
              <span className="text-xs font-medium">{item.reflexRestriction}</span>
            </div>

            <div className="flex flex-row gap-1 place-items-center">
              <span className='text-xs font-semibold capitalize text-muted-foreground'>{dexterityRestrictionIcon()}</span>
              <span className="text-xs font-medium">{item.dexterityRestriction}</span>
            </div>

            <div className="flex flex-row gap-1 place-items-center">
              <span className='text-xs font-semibold capitalize text-muted-foreground'>{initiativeRestrictionIcon()}</span>
              <span className="text-xs font-medium">{item.initiativeRestriction}</span>
            </div>

            <div className="flex flex-row gap-1 place-items-center">
              <span className='text-xs font-semibold capitalize text-muted-foreground'>{strengthRequirementIcon()}</span>
              <span className="text-xs font-medium">{item.strengthRequirement}</span>
            </div>

        </div>
      
    </div>
  )
}