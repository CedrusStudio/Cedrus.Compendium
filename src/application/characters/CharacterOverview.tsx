import { Character } from "@/domain/characters/Character";

export default function CharacterOverview(input: { character: Character })
{
  return (
    <div className="flex flex-col justify-around">
        <h1 className='text-xl text-center font-semibold text-primary pt-2 pb-8 capitalize'>
            {input.character.name}
        </h1>
        <span className='text-md text-center text-primary pb-12 capitalize'>
            {input.character.description}
        </span>
    </div>
  );
};
