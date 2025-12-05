"use client";

import { Badge } from '@/common/components/ui/badge';
import { type Armor } from '@/domain/characters/equipment/Armor';
import DefensiveItemViewFields from '@/application/common/equipment/Views/DefensiveItemViewFields';
import { immunityIcon, reductionArmorOrBlockIcon } from '@/common/icons';

type ArmorViewFieldsProps =
{
  armor: Armor;
  compact?: boolean;
}

export default function ArmorViewFields({ armor, compact = false }: ArmorViewFieldsProps)
{
  const armorSpecificBadges = (
    <>

      {
        armor.protection > 0 && (
          <Badge variant="secondary" className="h-9 px-2">
              <div>{reductionArmorOrBlockIcon("h-5 w-5")}</div>
              <div className="ml-1">{armor.protection}</div>
          </Badge>
        )
      }

      {
        armor.immunity > 0 && (
          <Badge variant="secondary" className="h-9 px-2">
              <div className="text-xs">{immunityIcon("h-5 w-5")}</div>
              <div className="ml-1">{armor.immunity}</div>
          </Badge>
        )
      }

    </>
  );

  return (
    <DefensiveItemViewFields 
      item={armor} 
      specificBadges={armorSpecificBadges}
      compact={compact}
    />
  );
}

