import { Label } from "@/ui/label"
import { displayedText } from '@/common/translations';
import { InputFormField } from '@/common/components/form/InputFormField';
import { FieldPath, useFormContext, useWatch } from 'react-hook-form';
import { SpellCostDto, SpellDto } from "@/persistence/schemas/characters/combat/powerSchema";
import CastablePerkEditableFields from "@/application/common/combat/CastablePerkEditableFields";
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { calculateSpellCost, formatSpellCost, normalizeSpellCost, spellCostPreviewStrengths, spellCostRoundings, spellCostScalingModes } from '@/domain/characters/combat/SpellCost';

type SpellEditableFieldsProps =
{
  pathPrefix?: string;
}

export default function SpellEditableFields({ pathPrefix = ""}: SpellEditableFieldsProps)
{
  const { control } = useFormContext<SpellDto>();
  const watchedCost = useWatch({
    control,
    name: `${pathPrefix}cost` as FieldPath<SpellDto>,
  }) as SpellCostDto | undefined;
  const spellCost = normalizeSpellCost(watchedCost);

  return (
    <>
      <CastablePerkEditableFields pathPrefix={pathPrefix} />

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 px-4 md:grid-cols-2">
        <div className="grid auto-rows-min gap-3 rounded-md border p-4 justify-items-center">
          <Label className='justify-center text-center text-sm leading-snug'><span className='first-letter:uppercase'>{displayedText.baseCost}</span></Label>
          <InputFormField<SpellDto>
            path={(`${pathPrefix}cost.baseCost` as FieldPath<SpellDto>)}
            numeric inputClassName='w-20 h-10 text-center font-medium'
          />
        </div>

        <div className="grid auto-rows-min gap-3 rounded-md border p-4 justify-items-center">
          <Label className='justify-center text-center text-sm leading-snug'><span className='first-letter:uppercase'>{displayedText.scalingMode}</span></Label>
          <SelectFormField<SpellDto>
            path={(`${pathPrefix}cost.scalingMode` as FieldPath<SpellDto>)}
            items={spellCostScalingModes}
            noLabel
          />
        </div>

        {
          spellCost.scalingMode !== 'fixed' && (
            <div className="grid auto-rows-min gap-3 rounded-md border p-4 justify-items-center">
              <Label className='justify-center text-center text-sm leading-snug'><span className='first-letter:uppercase'>{displayedText.scalingValue}</span></Label>
              <InputFormField<SpellDto>
                path={(`${pathPrefix}cost.scalingValue` as FieldPath<SpellDto>)}
                numeric inputClassName='w-20 h-10 text-center font-medium'
              />
            </div>
          )
        }

        {
          spellCost.scalingMode === 'divide' && (
            <div className="grid auto-rows-min gap-3 rounded-md border p-4 justify-items-center">
              <Label className='justify-center text-center text-sm leading-snug'><span className='first-letter:uppercase'>{displayedText.rounding}</span></Label>
              <SelectFormField<SpellDto>
                path={(`${pathPrefix}cost.rounding` as FieldPath<SpellDto>)}
                items={spellCostRoundings}
                noLabel
              />
            </div>
          )
        }
      </div>

      <div className="grid w-full max-w-3xl auto-rows-min gap-3 px-4">
        <Label className='justify-center text-center text-sm leading-snug'><span className='first-letter:uppercase'>{displayedText.costPreview}</span></Label>

        <div className="rounded-md border p-4">
          <p className="text-center text-sm font-medium text-primary">{formatSpellCost(spellCost)}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {
              spellCostPreviewStrengths.map((spellStrength) => (
                <div key={spellStrength} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  {displayedText.spellStrength} {spellStrength}: {calculateSpellCost(spellCost, spellStrength)}
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="hidden">
        <InputFormField<SpellDto> 
          path={(`${pathPrefix}cost.rounding` as FieldPath<SpellDto>)}
        />
      </div>
    </>
  );
};
