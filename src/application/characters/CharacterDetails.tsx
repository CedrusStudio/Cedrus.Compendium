import { Item, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { Character } from "@/domain/characters/Character";
import { Perk } from "@/domain/characters/Perk";
import { displayedText } from "@/presentation/translations";

export default function CharacterDetails({ character }: { character: Character }) 
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

        <h3 className="text-lg font-semibold text-center text-primary pb-4 capitalize">
          {displayedText.perks}
        </h3>

        <PerksList perks={character.perks} />

      </article>

    </section>
  );
}

function PerksList({ perks }: { perks: Perk[] })
{
  return (
    <ul className="list-inside grid grid-cols-2 gap-2">
    {
      perks.map((perk, index) => (
        <li key={index} className="text-md text-primary">
          <PerkView perk={perk} />
        </li>
      ))
    }
    </ul>
  );
}

function PerkView({ perk }: { perk: Perk })
{
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{perk.name} {perk.grade}</ItemTitle>
        <ItemDescription className="first-letter:uppercase">
          <p>{perk.description}</p>
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}