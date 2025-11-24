import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import { Character } from "@/domain/characters/Character";
import { Perk } from "@/domain/characters/Perk";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";

export default function CharacterPerksViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex place-content-center place-items-center">
        <DrawerTitle className="mt-3">Atuty</DrawerTitle>
        <DrawerHeader className="flex flex-row flex-wrap place-content-center place-items-center">
        {
          character.perks.map(perk => <PerkView perk={perk} key={perk.id} />)
        }
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

function PerkView({ perk }: { perk: Perk })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md min-w-50'>
      <FieldViewWithInfo
        value={perk.grade}
        infoContent={<span>{perk.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
      >
        {perk.name}
      </FieldViewWithInfo>
    </div>
  );
}