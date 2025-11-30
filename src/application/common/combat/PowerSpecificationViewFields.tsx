"use client";

import { Badge } from '@/common/components/ui/badge';
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';
import ViewDetailsWrapper from '@/application/common/ViewDetailsWrapper';
import FieldsViewWrapper from '@/application/common/FieldsViewWrapper';
import { PowerOffense, type PowerSpecification } from '@/domain/characters/combat/Power';
import TagsView from '@/common/components/tags/TagsView';

type PowerSpecificationViewFieldsProps =
{
  powerSpecification: PowerSpecification;
}

export default function PowerSpecificationViewFields({ powerSpecification }: PowerSpecificationViewFieldsProps)
{
  return (
    <FieldsViewWrapper>

      <ViewDetailsWrapper>

        <div className={"flex flex-col w-full p-2 rounded-md"}>
            <div className="flex flex-row flex-wrap gap-2 mb-0.5 place-items-center place-content-center sm:place-content-start">
                <TagsView tags={powerSpecification.tags} variant="secondary" />
            </div>

            <p className="text-sm text-muted-foreground break-words">{powerSpecification.description}</p>
        </div>



      </ViewDetailsWrapper>

      <div className="hidden sm:flex flex-row place-content-center gap-2">

        {
            powerSpecification.offenses.map((powerOffense, index) => <PowerOffenseView key={index} powerOffense={powerOffense} />)
        }

      </div>

    </FieldsViewWrapper>
  );
};

function PowerOffenseView({ powerOffense }: { powerOffense: PowerOffense })
{
  const damageBonusString = toOffenseString(powerOffense.spellDamage);
  
  return (
    <div className='flex flex-row gap-2 place-content-center'>
        
        <Badge variant="outline">
            <span>{toOffenseString(powerOffense.spellOffense)}</span>
            <Badge variant="secondary">{toCriticalRangeString(powerOffense.spellOffense)}, {powerOffense.spellOffense.critical.power >=0 ? "+" : ""}{powerOffense.spellOffense.critical.power}</Badge>
        </Badge>

        {
            damageBonusString && (
                <Badge variant="outline">
                    <span>{damageBonusString}</span>
                </Badge>
        )
        }
    </div>
  );
}