import { Field } from "@/common/components/fields";
import { Badge } from "@/common/components/ui/badge";
import { Power } from "@/domain/characters/combat/Power";
import { displayedText } from "@/common/translations";
import { Spell } from "@/domain/characters/combat/Power";
import { getCastTimeColors } from "@/common/colors";
import { Character } from "@/domain/characters/Character";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";

export default function CharacterPowersViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex place-content-center place-items-center">
        <DrawerTitle className="mt-3">Moce</DrawerTitle>
        <DrawerHeader className="flex flex-row flex-wrap place-content-center place-items-center">
        {
          character.powers.map(power => <PowerView power={power} key={power.id} />)
        }
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

function PowerView({ power }: { power: Power })
{
  return (
    <div className="flex flex-col gap-4 items-center border-1 rounded-md p-4 m-2">

      <DrawerTitle className="flex flex-row gap-3">

        <Field value={power.level + power.bonus} className="gap-1">
          <Field.Label className='w-4xs'>{power.name}</Field.Label>
          <Field.Value />
          <Field.Info>
            <div className="capitalize">{displayedText.level} {power.level}</div>
            <div className="capitalize">{displayedText.bonus} {power.bonus}</div>
          </Field.Info>
        </Field>
        
        <Badge variant="default" className="capitalize">{power.essence}</Badge>

      </DrawerTitle>

      <div className="flex flex-row items-center justify-center flex-wrap gap-3">
        {power.spells?.map(spell => <SpellView spell={spell} key={spell.id} />)}
      </div>
      
    </div>
  );
}

function SpellView({ spell }: { spell: Spell })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md min-w-50'>
      <Field value={spell.grade} className="gap-1">
        <Field.Label className='w-4xs'>{spell.name}</Field.Label>
        <Field.Value />
        <Field.Info className={`${getCastTimeColors(spell.castTime).text}`}>
          <span className="capitalize">{displayedText.action} <span className={`${getCastTimeColors(spell.castTime).text}`}>{spell.castTime.toLowerCase()}</span>. {spell.description}</span>
        </Field.Info>
      </Field>
    </div>
  );
}