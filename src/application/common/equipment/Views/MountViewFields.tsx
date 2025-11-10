"use client";

import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
import SummaryView from "@/application/common/SummaryView";
import { type Mount } from '@/domain/characters/equipment/Mount';
import { attributesIcons } from '@/presentation/icons';

type MountViewFieldsProps =
{
  mount: Mount;
}

export default function MountViewFields({ mount }: MountViewFieldsProps)
{
  return (
    <div className='flex flex-row place-items-center justify-between w-full gap-4'>

      <SummaryView entity={mount} />

      <div className="flex flex-row place-items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.pace}:</div>
          <div className="ml-1">{mount.paceSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.gallop}:</div>
          <div className="ml-1">{mount.gallopSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.canter}:</div>
          <div className="ml-1">{mount.canterSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{attributesIcons.horsemanship}</div>
          <div className="ml-1">{mount.horsemanshipBonus}</div>
        </Badge>

      </div>
    </div>
  );
}
