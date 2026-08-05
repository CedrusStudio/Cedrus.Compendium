import { Character } from "@/domain/characters/Character";
import HealthCard from "@/application/characters/combat/HealthCard";
import DefenseCard from "@/application/characters/combat/DefenseCard";
import OffenseCard from "@/application/characters/combat/offense/OffenseCard";
import ModesCard from "@/application/characters/combat/ModesCard";
import BarrierCard from "@/application/characters/combat/BarrierCard";
import ManeuversCard from "@/application/characters/combat/ManeuversCard";
import PowerCard from "@/application/characters/combat/power/PowerCard";
import { Activity } from "react";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import { BuffsDto } from "@/persistence/schemas/characters/buffs/buffsSchema";

type ModifierProfilesFieldName = 'buffProfiles' | 'stanceModifierProfiles' | 'stateModifierProfiles' | 'otherModifierProfiles';
type ActiveModifierProfileIdsFieldName = 'activeBuffProfileIds' | 'activeStanceModifierProfileIds' | 'activeStateModifierProfileIds' | 'activeOtherModifierProfileIds';

type CombatViewProps =
{
  character: Character;
  selectedStanceId?: string;
  selectedStateId?: string;
  onSelectedStanceIdChange?: (modeId: string | undefined) => void;
  onSelectedStateIdChange?: (modeId: string | undefined) => void;
};

export default function CombatView({ character, selectedStanceId, selectedStateId, onSelectedStanceIdChange, onSelectedStateIdChange }: CombatViewProps)
{
  const hasStances = character.stances.length > 0;
  const hasStates = character.states.length > 0;
  const hasSplitModesLayout = hasStances && hasStates;

  const { handleSubmit, isPending } = useFormMutation<BuffsDto>
  (
    async (data) => await charactersClient.updateBuffs(character.id, data),
    {
      invalidateOnSuccess: createCharacterCacheKeys(character.id),
      toastPosition: 'bottom-left',
    }
  );

  const linkedStanceProfiles = createLinkedModeProfiles
  (
    character,
    character.stanceModifierProfiles,
    'activeStanceModifierProfileIds',
    selectedStanceId,
    handleSubmit,
    isPending,
  );

  const linkedStateProfiles = createLinkedModeProfiles
  (
    character,
    character.stateModifierProfiles,
    'activeStateModifierProfileIds',
    selectedStateId,
    handleSubmit,
    isPending,
  );

  // Mode ids that have at least one linked wzmocnienie — surfaced in the picker.
  const stanceLinkedModeIds = collectLinkedModeIds(character.stanceModifierProfiles);
  const stateLinkedModeIds = collectLinkedModeIds(character.stateModifierProfiles);

  return (
    <div className='flex flex-col gap-3'>

      {/* Combat HUD: the vitals a player watches during a fight (HP, barrier,
          defense). Scrolls with the rest of the tab — not pinned. */}
      <div className='flex flex-col lg:grid lg:grid-cols-5 gap-3'>

        <div className="flex flex-col gap-2 lg:col-span-3">
          <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
          <BarrierCard health={character.health} />
        </div>

        <Activity mode={character.defenses.length > 0 ? "visible" : "hidden"}>
          <div className="lg:col-span-2 flex w-full">
            <DefenseCard defenses={character.defenses} defaultDefenseId={character.defaultDefenseId} />
          </div>
        </Activity>

      </div>

      {
        (hasStances || hasStates) && (
          <div className={hasSplitModesLayout ? "flex flex-col gap-3 lg:grid lg:grid-cols-2" : "flex flex-col gap-3"}>
            {
              hasStances && (
                <ModesCard
                  name="Postawy"
                  modes={character.stances}
                  selectedModeId={selectedStanceId}
                  onSelectedModeIdChange={onSelectedStanceIdChange}
                  linkedProfiles={linkedStanceProfiles}
                  linkedModeIds={stanceLinkedModeIds}
                />
              )
            }
            {
              hasStates && (
                <ModesCard
                  name="Stany"
                  modes={character.states}
                  selectedModeId={selectedStateId}
                  onSelectedModeIdChange={onSelectedStateIdChange}
                  linkedProfiles={linkedStateProfiles}
                  linkedModeIds={stateLinkedModeIds}
                />
              )
            }
          </div>
        )
      }

      <Activity mode={character.offenses.length > 0 ? "visible" : "hidden"}>
        <div className="lg:col-span-2 flex w-full">
          <OffenseCard offenses={character.offenses} defaultOffenseId={character.defaultOffenseId} />
        </div>
      </Activity>

      {
        character.maneuvers.length > 0 && <ManeuversCard maneuvers={character.maneuvers} />
      }

      {
        character.powers.map(power => <PowerCard power={power} key={power.id} />)
      }

    </div>
  );
};

function createLinkedModeProfiles(
  character: Character,
  profiles: Character['stanceModifierProfiles'] | Character['stateModifierProfiles'],
  activeIdsFieldName: ActiveModifierProfileIdsFieldName,
  selectedModeId: string | undefined,
  handleSubmit: (data: BuffsDto) => void,
  isPending: boolean,
)
{
  if (!selectedModeId)
  {
    return [];
  }

  return profiles
    .filter(profile => profile.linkedEntityId === selectedModeId)
    .map(profile => ({
      id: profile.id,
      name: profile.name,
      isActive: character[activeIdsFieldName].includes(profile.id) || isPending,
      onApply: () => handleSubmit(createBuffsPayload(character,
      {
        [activeIdsFieldName]: character[activeIdsFieldName].includes(profile.id)
          ? character[activeIdsFieldName]
          : [...character[activeIdsFieldName], profile.id],
      })),
      onWithdraw: () => handleSubmit(createBuffsPayload(character,
      {
        [activeIdsFieldName]: character[activeIdsFieldName].filter(activeId => activeId !== profile.id),
      })),
    }));
}

function collectLinkedModeIds(profiles: Character['stanceModifierProfiles'] | Character['stateModifierProfiles']): string[]
{
  return [...new Set(profiles.map(profile => profile.linkedEntityId).filter((id): id is string => Boolean(id)))];
}

function createBuffsPayload(character: Character, overrides: Partial<BuffsDto>): BuffsDto
{
  return {
    buffProfiles: character.buffProfiles,
    activeBuffProfileIds: character.activeBuffProfileIds,
    stanceModifierProfiles: character.stanceModifierProfiles,
    activeStanceModifierProfileIds: character.activeStanceModifierProfileIds,
    stateModifierProfiles: character.stateModifierProfiles,
    activeStateModifierProfileIds: character.activeStateModifierProfileIds,
    otherModifierProfiles: character.otherModifierProfiles,
    activeOtherModifierProfileIds: character.activeOtherModifierProfileIds,
    ...overrides,
  };
}
