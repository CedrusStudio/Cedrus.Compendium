
import { allowedReductionTypes, calculateSelectedReduction, ReductionType } from "@/domain/characters/combat/Defense";
import { useState } from "react";
import { immunityIcon, resistanceIcon } from "@/presentation/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import DefenseReductionInfoContent from "@/application/characters/combat/DefenseReductionInfoContent";
import FieldWithIconView from "@/common/components/fields/FieldWithIconView";
import { reductionIcons } from "@/presentation/icons";
import FieldWithTooltip from "@/common/components/fields/FieldWithTooltip";
import { Character } from "@/domain/characters/Character";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { displayedText } from "@/presentation/translations";

export default function CharacterDefensesBattleView({ character }: { character : Character })
{
  const [selectedDefenseIndex, setSelectedDefenseIndex] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");
  const selectedDefense = character.defenses[selectedDefenseIndex];
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };

  return (
    <div className="flex flex-row items-center">
      {
        character.defenses.length > 1 && (
          <SelectOneOf 
            name='defense' 
            defaultValue='0' 
            index={selectedDefenseIndex} 
            items={character.defenses} 
            setIndex={setSelectedDefenseIndex} 
            disableInfo 
          />
        )
      }

      <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>

        {
          selectedDefense.immunity > 0 && (
            <FieldWithIconView value={selectedDefense.immunity} >
              <FieldWithTooltip name={displayedText.immunity}>{immunityIcon("w-5 h-5")}</FieldWithTooltip>
            </FieldWithIconView>
          )
        }        

        {
          selectedDefense.resistance > 0 && (
            <FieldWithIconView value={selectedDefense.resistance} >
              <FieldWithTooltip name={displayedText.resistance}>{resistanceIcon("w-5 h-5")}</FieldWithTooltip>
            </FieldWithIconView>
          )
        }

        <FieldViewWithInfo
          value={calculateSelectedReduction(selectedDefense, selectedReductionType)} 
          infoContent={<DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} />}
        >
          <SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>
        </FieldViewWithInfo>
        
        <SelectContent>
        {
          allowedReductionTypes.map(reductionType => (
            <SelectItem key={reductionType} value={reductionType}>
              <span className='capitalize'>{reductionIcons[reductionType]}</span>
            </SelectItem>
          ))
        }
        </SelectContent>
      </Select>

    </div>
  );
};