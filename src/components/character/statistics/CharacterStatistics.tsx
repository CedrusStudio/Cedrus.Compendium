import StatisticsCard from "@/components/character/statistics/StatisticsCard";
import { Character } from "@/domain/Character";
import { namingConventions } from "@/domain/data/namingConventions";
import { attributesIcons, characteristicIcons } from "@/utils/icons";

export default function CharacterStatistics(input: { character: Character })
{
  const { character } = input;

  return (
    <div className="flex flex-col gap-2">
        <StatisticsCard 
          title={namingConventions.characteristics} 
          statistics={Object.entries(character.characteristics).map(([name, value]) => [name, value, characteristicIcons[name]])} 
        />

        <StatisticsCard 
          title={namingConventions.attributes} 
          statistics={Object.entries(character.attributes).map(([name, value]) => [name, value, attributesIcons[name]])} 
        />
    </div>
  );
};