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

  return (
    <>
      <div>
        {character?.name ?? `character not found for id: ${params.id}`}
      </div>
    </>
  );
};