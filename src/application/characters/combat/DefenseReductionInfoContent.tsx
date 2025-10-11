import FieldView from "@/common/components/fields/FieldView";
import { Defense, reductionSelectFilter, ReductionType } from "@/domain/characters/Character";
import { namingConventions } from "@/domain/data/namingConventions";
import { translate } from "@/domain/data/translations";

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
    <div className="flex flex-wrap flex-col items-center">
      { input.reductionIncrease ? <FieldView name={namingConventions.increase} value={Math.abs(input.reductionIncrease)} valueClassName='text-green-600' nameClassName="w-24" /> : null }
      { input.damageTaken ? <FieldView name={namingConventions.damage} value={Math.abs(input.damageTaken)} valueClassName='text-red-500' nameClassName="w-24" /> : null }
      {
        Object.entries(input.defense)
          .filter(([name, _]) => reductionSelectFilter(input.selectedReductionType)(name))
          .map(([name, value]) => <FieldView key={name} name={translate(name)} value={value} nameClassName="w-24" />)
      }
    </div>
  );
}