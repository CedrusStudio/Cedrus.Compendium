import FieldView from "@/common/components/fields/FieldView";
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
    <div className="flex flex-wrap flex-col items-center">

    { 
      input.reductionIncrease 
        ? <FieldView value={Math.abs(input.reductionIncrease)} valueClassName='text-green-600' childrenClassName="w-24">{displayedText.increase}</FieldView>  
        : null
    }
      
    { 
      input.damageTaken 
        ? <FieldView value={Math.abs(input.damageTaken)} valueClassName='text-red-500' childrenClassName="w-24">{displayedText.damage}</FieldView> 
        : null 
    }

    {
      filteredDefenseKeys(input.defense, input.selectedReductionType)
        .map(name => <FieldView key={name} value={input.defense[name] as number} childrenClassName="w-24">{displayedText[name as keyof typeof displayedText]}</FieldView>)
    }

    </div>
  );
}