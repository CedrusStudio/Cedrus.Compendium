import { Character } from "@/domain/Character";
import HealthCard from "@/components/character/combat/HealthCard";
import DefenseCard from "@/components/character/combat/DefenseCard";
import OffenseCard from "@/components/character/combat/OffenseCard";
import ModesCard from "@/components/character/combat/ModesCard";

export default function CombatView({ character }: { character: Character })
{
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
        <DefenseCard defense={character.defense} />
      </div>
      <OffenseCard offense={character.offense} />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <ModesCard name="Stances" modes={character.stances} />
        <ModesCard name="States" modes={character.states} />
      </div>
    </div>
  );
};