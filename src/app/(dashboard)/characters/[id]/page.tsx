import StatisticsCard from '@/components/character/StatisticsCard';
import { characterRepository } from '@/persistence/characterRepository';

type CharacterProps = 
{
    params: 
    {
        id: string;
    };
};

export default async function CharacterPage(input: CharacterProps)
{
  const params = await input.params;
  const character = characterRepository.get(params.id);

  if (!character) return <NoCharacter />;

  return (
    <div className='flex flex-col'>
      <h2 className='text-xl text-center font-semibold text-primary pt-2 pb-12 capitalize'>{character.name}</h2>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 px-4'>
        <StatisticsCard title="Characteristics" statistics={Object.entries(character.characteristics)} />
        <StatisticsCard title="Attributes" statistics={Object.entries(character.attributes)} />
      </div>
    </div>
  );
};

function NoCharacter()
{
  return (
    <div className='flex items-center justify-center mt-8'>
      <h2 className='text-xl'>Character not found...</h2>
    </div>
  );
}