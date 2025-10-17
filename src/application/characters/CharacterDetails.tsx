import { Character } from "@/domain/characters/Character";

export default function CharacterDetails({ character }: { character: Character }) 
{
  return (
    <section className="flex flex-col justify-around">
      <header>
        <h1 className="text-xl text-center font-semibold text-primary pt-2 pb-6 capitalize">
          {character.name}
        </h1>
        <h2 className="text-md text-center text-primary pb-10 capitalize">
          {character.category} {character.shortName}
        </h2>
      </header>
      <article>
        <p className="text-md text-center text-primary pb-12 first-letter:uppercase">
          {character.description}
        </p>
      </article>
    </section>
  );
}