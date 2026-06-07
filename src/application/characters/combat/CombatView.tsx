import { Character } from "@/domain/characters/Character";
import HealthCard from "@/application/characters/combat/HealthCard";
import DefenseCard from "@/application/characters/combat/DefenseCard";
import OffenseCard from "@/application/characters/combat/offense/OffenseCard";
import ModesCard from "@/application/characters/combat/ModesCard";
import BarrierCard from "@/application/characters/combat/BarrierCard";
import ManeuversCard from "@/application/characters/combat/ManeuversCard";
import PowerCard from "@/application/characters/combat/power/PowerCard";
import { Activity } from "react";
import { applyActiveBuffProfile } from "@/domain/characters/buffs/applyBuffProfile";

export default function CombatView({ character }: { character: Character })
{
  const buffedCharacter = applyActiveBuffProfile(character);
  const hasStances = buffedCharacter.stances.length > 0;
  const hasStates = buffedCharacter.states.length > 0;
  const hasSplitModesLayout = hasStances && hasStates;

  return (
    <div className='flex flex-col gap-3'>

      <div className='flex flex-col lg:grid lg:grid-cols-5 gap-3'>
        
        <div className="flex flex-col gap-2 lg:col-span-3">
          <HealthCard health={buffedCharacter.health} constitution={buffedCharacter.characteristics.constitution} fortitude={buffedCharacter.attributes.fortitude} />
          <BarrierCard health={buffedCharacter.health} />
        </div>

        <Activity mode={buffedCharacter.defenses.length > 0 ? "visible" : "hidden"}>
          <div className="lg:col-span-2 flex w-full">
            <DefenseCard defenses={buffedCharacter.defenses} />
          </div>
        </Activity>

      </div>

      {
        (hasStances || hasStates) && (
          <div className={hasSplitModesLayout ? "flex flex-col gap-3 lg:grid lg:grid-cols-2" : "flex flex-col gap-3"}>
            {
              hasStances && <ModesCard name="Postawy" modes={buffedCharacter.stances} />
            }
            {
              hasStates && <ModesCard name="Stany" modes={buffedCharacter.states} />
            }
          </div>
        )
      }

      <Activity mode={buffedCharacter.offenses.length > 0 ? "visible" : "hidden"}>
        <div className="lg:col-span-2 flex w-full">
          <OffenseCard offenses={buffedCharacter.offenses} />
        </div>
      </Activity>

      {
        buffedCharacter.maneuvers.length > 0 && <ManeuversCard maneuvers={buffedCharacter.maneuvers} />
      }

      {
        buffedCharacter.powers.map(power => <PowerCard power={power} key={power.id} />)
      }

    </div>
  );
};
