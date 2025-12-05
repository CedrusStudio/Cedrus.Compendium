import { Field } from "@/common/components/fields";
import { Defense, filteredDefenseKeys, ReductionType } from "@/domain/characters/combat/Defense";
import { displayedText } from "@/presentation/translations";

type DefenseReductionInfoContentProps =
{
  defense: Defense;
  selectedReductionType: ReductionType;
  reductionIncrease?: number;
  damageTaken?: number;
}

export default function DefenseReductionInfoContent(input: DefenseReductionInfoContentProps)
{
  return (
    <div className="flex flex-wrap flex-col place-content-center place-items-start">

        <Field key="reductionIncrease" value={Math.abs(input.reductionIncrease || 0)} valueClassName='text-green-600'>
          <Field.Label className="w-24">{displayedText.increase}</Field.Label>
          <Field.Value />
        </Field>

        <Field key="damageTaken" value={Math.abs(input.damageTaken || 0)} valueClassName='text-red-500'>
          <Field.Label className="w-24">{displayedText.damage}</Field.Label>
          <Field.Value />
        </Field>

    {
      filteredDefenseKeys(input.defense, input.selectedReductionType)
        .map(name => (
          <Field key={name} value={input.defense[name] as number}>
            <Field.Label className="w-24">{displayedText[name as keyof typeof displayedText]}</Field.Label>
            <Field.Value />
          </Field>
        ))
    }

    </div>
  );
}