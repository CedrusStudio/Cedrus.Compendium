import { Character } from "@/domain/Character";
import EditHealthCard from "@/components/character/edit/combat/EditHealthCard";
import EditDefenseCard from "@/components/character/edit/combat/EditDefenseCard";

type EditCharacterCombatProps =
{
    character: Character;
}

export default function EditCharacterCombat({ character }: EditCharacterCombatProps)
{
  return (
    <div>
      <EditHealthCard health={character.health} />
      <EditDefenseCard defense={character.defense} />
    </div>
  );
};