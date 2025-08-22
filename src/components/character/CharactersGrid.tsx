import CharacterCard from '@/components/character/CharacterCard';
import { Character } from '@/domain/Character';

type CharactersGridParams =
{
  characters: Character[];
}

export default function CharactersGrid({ characters }: CharactersGridParams)
{
  if (characters.length < 1) return <NoCharacters />;

  characters = 
  [
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters, 
    ...characters
  ]

  return (
    <>
      <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6 m-4'>
      {
        characters.map(character => (
          <CharacterCard key={character.id} character={character} />
        ))
      }
      </div>
    </>
  );
};

function NoCharacters()
{
  return (
    <div className='flex items-center justify-center mt-8'>
      <h2 className='text-xl'>No Characters found...</h2>
    </div>
  );
}