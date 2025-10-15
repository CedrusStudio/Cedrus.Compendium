import StatisticsCard from "@/application/characters/statistics/StatisticsCard";
import { Character } from "@/domain/characters/Character";
import { namingConventions } from "@/presentation/namingConventions";
import { attributesIcons, characteristicIcons } from "@/presentation/icons";

export default function StatisticsView(input: { character: Character })
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