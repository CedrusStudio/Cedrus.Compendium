import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { Character } from "@/domain/characters/Character";
import PerksList from "@/application/characters/details/PerksList";
import TagsView from "@/common/components/tags/TagsView";
import ExpandableText from "@/common/components/text/ExpandableText";
import Link from "next/link";
import { Button } from "@/common/components/ui/button";
import { displayedText } from "@/common/translations";
import CharacterTitleTransition from "@/application/characters/CharacterTitleTransition";

export default function DetailsView({ character }: { character: Character }) 
{
  return (
    <section className="flex flex-col justify-around">

      <header className="flex flex-col place-content-center mb-4 lg:mb-6 mt-2 gap-3">

        <div className="flex flex-wrap place-content-center mt-2 gap-3">
          <CharacterTitleTransition id={character.id} detail>
            <h1 className="break-words text-center font-semibold text-primary capitalize text-lg">{character.name}</h1>
          </CharacterTitleTransition>

          <Badge variant="outline" className="text-md text-primary capitalize">
            {character.shortName}
          </Badge>
        </div>

        <TagsView tags={character.tags} />

        {
          character.race && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className="text-sm text-muted-foreground capitalize">
                {displayedText.race || "Rasa"}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/compendium/races?search=${encodeURIComponent(character.race.name)}`}>
                  <span className="font-medium">{character.race.name}</span>
                </Link>
              </Button>
            </div>
          )
        }

      </header>

      <article>

        <div className="pb-8">
          <ExpandableText
            text={character.description}
            className="text-md text-center text-primary first-letter:uppercase whitespace-pre-wrap break-words"
          />
        </div>

        <Separator className="mb-6" />
        <PerksList perks={character.perks} />

      </article>

    </section>
  );
}
