import StatisticsCard from "@/components/character/StatisticsCard";
import { Character } from "@/domain/Character";
import { attributesIcons, characteristicIcons } from "@/utils/icons";

export default function CharacterCarousel(input: { character: Character })
{
  const { character } = input;

  return (
    <div className="flex flex-col gap-2">
        <StatisticsCard title="Characteristics" statistics={Object.entries(character.characteristics).map(([name, value]) => [name, value, characteristicIcons[name]])} />
        <StatisticsCard title="Attributes" statistics={Object.entries(character.attributes).map(([name, value]) => [name, value, attributesIcons[name]])} />
    </div>
  );
};