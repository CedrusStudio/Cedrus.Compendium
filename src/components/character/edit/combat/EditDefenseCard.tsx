import { Defense } from '@/domain/Character';
import { UpsertCharacterCombatType } from '@/persistence/characterSchemas';
import { Control } from 'react-hook-form';

type EditDefenseCardProps =
{
    defense: Defense;
    control: Control<UpsertCharacterCombatType>;
}

export default function EditDefenseCard({ defense, control }: EditDefenseCardProps)
{
  return (
    <div>
      EditDefenseCard
    </div>
  );
};