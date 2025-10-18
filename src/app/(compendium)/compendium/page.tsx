import { seed } from "@/../prisma/seed";
import { getCharacters } from "@/persistence/charactersRepository";

export default async function CompendiumPage()
{
  await seed();

  const characters = await getCharacters();

  return (
    <div>
      {characters.map((character) => (
        <div key={character.id}>
          <h2>{character.name}</h2>
          <p>{character.description}</p>
        </div>
      ))}
    </div>
  );
};