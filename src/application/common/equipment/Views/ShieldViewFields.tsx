"use client";

import { Badge } from '@/common/components/ui/badge';
import { type Shield } from '@/domain/characters/equipment/Shield';
import DefensiveItemViewFields from './DefensiveItemViewFields';
import { reductionArmorOrBlockIcon } from '@/common/icons';

type ShieldViewFieldsProps =
{
  shield: Shield;
  compact?: boolean;
}

export default function ShieldViewFields({ shield, compact = false }: ShieldViewFieldsProps)
{
  const shieldSpecificBadges = (
    <>
        {
            shield.block > 0 && (
                <Badge variant="secondary" className="h-9 px-2">
                    <div>{reductionArmorOrBlockIcon("h-5 w-5")}</div>
                    <div className="ml-1">{shield.block}</div>
                </Badge>
            )
        }
    </>
  );

  return (
    <DefensiveItemViewFields 
      item={shield} 
      specificBadges={shieldSpecificBadges}
      compact={compact}
    />
  );
}

