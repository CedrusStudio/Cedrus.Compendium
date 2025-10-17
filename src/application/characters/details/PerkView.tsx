import { Item, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { Perk } from "@/domain/characters/Perk";

export default function PerkView({ perk }: { perk: Perk })
{
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{perk.name} {perk.grade}</ItemTitle>
        <ItemDescription className="first-letter:uppercase">
          {perk.description}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
};