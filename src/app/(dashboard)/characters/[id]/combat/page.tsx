import DefenseCard from '@/components/character/combat/DefenseCard';
import HealthCard from '@/components/character/combat/HealthCard';
import OffenseCard from '@/components/character/combat/OffenseCard';
import { characterRepository } from '@/persistence/characterRepository';

type CombatPageProps = 
{
    params: 
    {
        id: string;
    };
};

export default async function CombatPage(input: CombatPageProps)
{
  const params = await input.params;
  const character = characterRepository.get(params.id);
  if (!character) throw Error("Character not found");
  
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <HealthCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
        <DefenseCard defense={character.defense} />
      </div>
      <OffenseCard offense={character.offense} />
    </div>
  );
};