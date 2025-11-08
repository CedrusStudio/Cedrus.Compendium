import { Item, ItemContent, ItemDescription, ItemTitle } from "@/ui/item";
import { Perk } from "@/domain/characters/Perk";
import TagsView from "@/common/components/tags/TagsView";

export default function PerkView({ perk }: { perk: Perk })
{
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{perk.name} {perk.grade} <TagsView tags={perk.tags} /></ItemTitle>
        <ItemDescription className="first-letter:uppercase">
          {perk.description}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
};