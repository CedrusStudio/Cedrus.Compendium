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

    { 
      input.reductionIncrease 
        ? <FieldView value={Math.abs(input.reductionIncrease)} valueClassName='text-green-600' childrenClassName="w-24">{namingConventions.increase}</FieldView>  
        : null
    }
      
    { 
      input.damageTaken 
        ? <FieldView value={Math.abs(input.damageTaken)} valueClassName='text-red-500' childrenClassName="w-24">{namingConventions.damage}</FieldView> 
        : null 
    }

    {
      Object.entries(input.defense)
        .filter(([name, _]) => reductionSelectFilter(input.selectedReductionType)(name))
        .map(([name, value]) => <FieldView key={name} value={value} childrenClassName="w-24">{translate(name)}</FieldView>)
    }

    </div>
  );
}