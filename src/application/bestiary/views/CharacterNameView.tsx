import { Character } from "@/domain/characters/Character";
import { useRouter } from "next/navigation";
import { Button } from "@/common/components/ui/button";
import { goToIcon } from "@/presentation/icons";

export default function CharacterNameView({ character }: {character: Character})
{
  const route = useRouter();

  return (
    <div className="flex flex-row place-items-center place-content-center">
      <span className="block lg:hidden">{character.shortName}</span>
      <span className="hidden lg:block">{character.name}</span>
      <Button variant="ghost" size="icon" onClick={() => route.push(`/characters/${character.id}?tab=combat`)}>{goToIcon}</Button>
    </div>
  );
}