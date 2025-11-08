import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { Character } from "@/domain/characters/Character";
import PerksList from "@/application/characters/details/PerksList";
import TagsView from "@/common/components/tags/TagsView";

export default function DetailsView({ character }: { character: Character }) 
{
  return (
    <section className="flex flex-col justify-around">

      <header className="flex flex-col place-content-center mb-4 lg:mb-6 mt-2 gap-3">

        <div className="flex flex-row place-content-center mt-2 gap-3">
          <h1 className="font-semibold text-primary capitalize text-lg hidden sm:block">
            {character.name}
          </h1>

          <Badge variant="outline" className="text-md text-primary capitalize">
            {character.shortName}
          </Badge>
        </div>

        <TagsView tags={character.tags} />

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