import { Character } from "@/domain/Character";
import HealthCard from "@/components/character/combat/HealthCard";
import DefenseCard from "@/components/character/combat/DefenseCard";
import OffenseCard from "@/components/character/combat/OffenseCard";
import ModesCard from "@/components/character/combat/ModesCard";
import BarrierCard from "@/components/character/combat/BarrierCard";
import ManeuversView from "@/components/character/combat/ManeuversView";

export default function CombatView({ character }: { character: Character })
{
  return (
    <div className='flex flex-col gap-4'>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
        <DefenseCard defense={character.defense} />
        <BarrierCard health={character.health} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-6 gap-4'>
        
        <div className='col-span-4'>
          <OffenseCard offense={character.offense} />
        </div>

        <ModesCard name="Stances" modes={character.stances} />
        <ModesCard name="States" modes={character.states} />
      </div>

      <ManeuversView maneuvers={character.maneuvers} />
    </div>
  );
};