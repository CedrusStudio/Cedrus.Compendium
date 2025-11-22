import { Character } from "@/domain/characters/Character";
import HealthCard from "@/application/characters/combat/HealthCard";
import DefenseCard from "@/application/characters/combat/DefenseCard";
import OffenseCard from "@/application/characters/combat/OffenseCard";
import ModesCard from "@/application/characters/combat/ModesCard";
import BarrierCard from "@/application/characters/combat/BarrierCard";
import ManeuversCard from "@/application/characters/combat/ManeuversCard";
import PowerCard from "@/application/characters/combat/PowerCard";

export default function CombatView({ character }: { character: Character })
{
  return (
    <div className='flex flex-col gap-3'>

      <div className='flex flex-col lg:grid lg:grid-cols-5 gap-3'>
        <div className="flex flex-col gap-2 lg:col-span-3">
          <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
          <BarrierCard health={character.health} />
        </div>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:col-span-2">
          <ModesCard name="Postawy" modes={character.stances} />
          <ModesCard name="Stany" modes={character.states} />
        </div>
      </div>


      <div className='flex flex-col lg:grid lg:grid-cols-2 gap-3'>
      {
        character.offenses.length > 0 && <OffenseCard offenses={character.offenses} />
      }
      {
        character.defenses.length > 0 && <DefenseCard defenses={character.defenses} />
      }
      </div>

      <ManeuversCard maneuvers={character.maneuvers} />

      {
        character.powers.map(power => <PowerCard power={power} key={power.id} />)
      }

    </div>
  );
};
