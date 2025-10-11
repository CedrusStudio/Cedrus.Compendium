import { Character } from "@/domain/characters/Character";

export default function CharacterOverview(input: { character: Character })
{
  return (
    <div className="flex flex-col justify-around">
      <h1 className='text-xl text-center font-semibold text-primary pt-2 pb-6 capitalize'>
        {input.character.name}
      </h1>
      <h2 className='text-md text-center text-primary pb-12 capitalize'>
        {input.character.category} {input.character.shortName}
      </h2>
      <p className='text-md text-center text-primary pb-12 capitalize'>
        {input.character.description}
      </p>
    </div>
  );
};
