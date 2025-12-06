
import { allowedReductionTypes, calculateSelectedReduction, ReductionType } from "@/domain/characters/combat/Defense";
import { Activity, useState } from "react";
import { immunityIcon, resistanceIcon } from "@/common/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Field } from "@/common/components/fields";
import DefenseReductionInfoContent from "@/application/characters/combat/DefenseReductionInfoContent";
import { reductionIcons } from "@/common/icons";
import { Character } from "@/domain/characters/Character";
import SelectOneOf from "@/common/components/selects/SelectOneOf";

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

        <Activity mode={selectedDefense.immunity > 0 ? "visible" : "hidden"}>
          <Field value={selectedDefense.immunity}>
            <Field.Icon>{immunityIcon("w-5 h-5")}</Field.Icon>
            <Field.Value />
          </Field>
        </Activity>

        <Activity mode={selectedDefense.resistance > 0 ? "visible" : "hidden"}>
          <Field value={selectedDefense.resistance}>
            <Field.Icon>{resistanceIcon("w-5 h-5")}</Field.Icon>
            <Field.Value />
          </Field>
        </Activity>

        <Field value={calculateSelectedReduction(selectedDefense, selectedReductionType)}>
          <Field.Label>
            <SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>
          </Field.Label>
          <Field.Value />
          <Field.Info>
            <DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} />
          </Field.Info>
        </Field>
        
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