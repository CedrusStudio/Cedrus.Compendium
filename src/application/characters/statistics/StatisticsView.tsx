import StatisticsCard from "@/application/characters/statistics/StatisticsCard";
import { Character } from "@/domain/characters/Character";
import { displayedText } from "@/presentation/translations";
import { attributesIcons, characteristicIcons } from "@/presentation/icons";

export default function StatisticsView(input: { character: Character })
{
  const { character } = input;

  return (
    <div className="flex flex-col gap-4">
        <StatisticsCard 
          title={displayedText.characteristics} 
          statistics={Object.entries(character.characteristics).map(([name, value]) => [name, value, characteristicIcons[name]])} 
        />

        <StatisticsCard 
          title={displayedText.attributes} 
          statistics={Object.entries(character.attributes).map(([name, value]) => [name, value, attributesIcons[name]])} 
        />
    </div>
  );
};