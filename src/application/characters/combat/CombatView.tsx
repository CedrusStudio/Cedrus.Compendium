import { Character } from "@/domain/characters/Character";
import HealthCard from "@/application/characters/combat/HealthCard";
import DefenseCard from "@/application/characters/combat/DefenseCard";
import OffenseCard from "@/application/characters/combat/OffenseCard";
import ModesCard from "@/application/characters/combat/ModesCard";
import BarrierCard from "@/application/characters/combat/BarrierCard";
import ManeuversView from "@/application/characters/combat/ManeuversView";

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

        <ModesCard name="Postawy" modes={character.stances} />
        <ModesCard name="Stany" modes={character.states} />
      </div>

      <ManeuversView maneuvers={character.maneuvers} />
    </div>
  );
};