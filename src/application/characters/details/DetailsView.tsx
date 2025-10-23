import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { Character } from "@/domain/characters/Character";
import PerksList from "@/application/characters/details/PerksList";

export default function DetailsView({ character }: { character: Character }) 
{
  return (
    <section className="flex flex-col justify-around">

      <header className="flex flex-row items-center justify-center mb-4 lg:mb-6 mt-2 gap-3">

        <h1 className="font-semibold text-primary capitalize text-lg hidden sm:block">
          {character.name}
        </h1>

        <Badge variant="secondary" className="text-md text-primary capitalize">
          {character.category} {character.shortName}
        </Badge>

      </header>

      <article>

        <p className="text-md text-center text-primary pb-8 first-letter:uppercase">
          {character.description}
        </p>

        <Separator className="mb-6" />
        <PerksList perks={character.perks} />

      </article>

    </section>
  );
}