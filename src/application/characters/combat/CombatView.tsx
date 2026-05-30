import { Character } from "@/domain/characters/Character";
import HealthCard from "@/application/characters/combat/HealthCard";
import DefenseCard from "@/application/characters/combat/DefenseCard";
import OffenseCard from "@/application/characters/combat/offense/OffenseCard";
import ModesCard from "@/application/characters/combat/ModesCard";
import BarrierCard from "@/application/characters/combat/BarrierCard";
import ManeuversCard from "@/application/characters/combat/ManeuversCard";
import PowerCard from "@/application/characters/combat/power/PowerCard";
import { Activity } from "react";

export default function CombatView({ character }: { character: Character })
{
  const hasStances = character.stances.length > 0;
  const hasStates = character.states.length > 0;
  const hasSplitModesLayout = hasStances && hasStates;

  return (
    <div className='flex flex-col gap-3'>

      <div className='flex flex-col lg:grid lg:grid-cols-5 gap-3'>
        
        <div className="flex flex-col gap-2 lg:col-span-3">
          <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
          <BarrierCard health={character.health} />
        </div>

        <Activity mode={character.defenses.length > 0 ? "visible" : "hidden"}>
          <div className="lg:col-span-2 flex w-full">
            <DefenseCard defenses={character.defenses} />
          </div>
        </Activity>

      </div>

      {
        (hasStances || hasStates) && (
          <div className={hasSplitModesLayout ? "flex flex-col gap-3 lg:grid lg:grid-cols-2" : "flex flex-col gap-3"}>
            {
              hasStances && <ModesCard name="Postawy" modes={character.stances} />
            }
            {
              hasStates && <ModesCard name="Stany" modes={character.states} />
            }
          </div>
        )
      }

      <Activity mode={character.offenses.length > 0 ? "visible" : "hidden"}>
        <div className="lg:col-span-2 flex w-full">
          <OffenseCard offenses={character.offenses} />
        </div>
      </Activity>

      <ManeuversCard maneuvers={character.maneuvers} />

      {
        character.powers.map(power => <PowerCard power={power} key={power.id} />)
      }

    </div>
  );
};
