import { Field } from "@/common/components/fields";
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
      <Field value={perk.grade} className="gap-1">
        <Field.Label className='w-4xs'>{perk.name}</Field.Label>
        <Field.Value />
        <Field.Info>
          <span>{perk.description}</span>
        </Field.Info>
      </Field>
    </div>
  );
}