import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { Character } from "@/domain/characters/Character";
import PerksList from "@/application/characters/details/PerksList";

export default function DetailsView({ character }: { character: Character }) 
{
  return (
    <section className="flex flex-col justify-around">

      <header className="grid grid-cols-3 items-center mb-6 mt-4">

        <div className="col-span-1" />

        <div className="col-span-1 flex items-center justify-center">
          <h1 className="font-semibold text-primary capitalize text-lg">
            {character.name}
          </h1>
        </div>

        <div className="col-span-1 flex justify-end">
          <Badge variant="secondary" className="text-md text-right text-primary capitalize">
            {character.category} {character.shortName}
          </Badge>
        </div>
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