import EquipmentAccordion from '@/components/character/EquipmentAccordion';
import { Character } from '@/domain/Character';

export default function CharacterEquipmentEdit({ character }: { character: Character })
{
  return (
    <EquipmentAccordion equipment={character.equipment} />
  );
};