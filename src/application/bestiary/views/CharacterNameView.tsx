import { Character } from "@/domain/characters/Character";
import { Button } from "@/common/components/ui/button";
import { goToIcon } from "@/presentation/icons";
import Link from "next/link";

export default function CharacterNameView({ character }: {character: Character})
{
  return (
    <div className="flex flex-row place-items-center place-content-center">
      <span className="block lg:hidden">{character.shortName}</span>
      <span className="hidden lg:block">{character.name}</span>
      <Button asChild variant="ghost" size="icon">
          <Link href={`/characters/${character.id}?tab=combat`}>{goToIcon}</Link>
      </Button>
    </div>
  );
}