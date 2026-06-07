import StatisticsCard from "@/application/characters/statistics/StatisticsCard";
import { Character } from "@/domain/characters/Character";
import { displayedText } from "@/common/translations";
import { attributesIcons, characteristicIcons } from "@/common/icons";
import { applyActiveBuffProfile } from "@/domain/characters/buffs/applyBuffProfile";

export default function StatisticsView(input: { character: Character })
{
  const character = applyActiveBuffProfile(input.character);

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