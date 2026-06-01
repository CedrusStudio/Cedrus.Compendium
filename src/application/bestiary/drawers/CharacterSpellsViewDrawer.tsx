import { Field } from "@/common/components/fields";
import { Badge } from "@/common/components/ui/badge";
import { displayedText } from "@/common/translations";
import { getCastTimeColors } from "@/common/colors";
import { Character } from "@/domain/characters/Character";
import { Spell } from "@/domain/characters/combat/Power";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";

type CharacterSpellEntry = {
  powerName: string;
  spell: Spell;
};

export default function CharacterSpellsViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  const spells = character.powers.flatMap<CharacterSpellEntry>(power =>
    (power.spells ?? []).map(spell => ({ powerName: power.name, spell }))
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex place-content-center place-items-center">
        <DrawerTitle className="mt-3 capitalize">{displayedText.spells}</DrawerTitle>
        <DrawerHeader className="flex flex-row flex-wrap place-content-center place-items-center">
        {
          spells.length > 0
            ? spells.map(({ powerName, spell }) => <SpellView spell={spell} powerName={powerName} key={`${spell.id}-${powerName}`} />)
            : <p className="text-sm text-muted-foreground">{displayedText.no_spells_found}</p>
        }
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

function SpellView({ spell, powerName }: { spell: Spell, powerName: string })
{
  return (
    <div className="m-2 flex min-w-64 flex-col gap-3 rounded-md border p-4">
      <Field value={spell.grade} className="gap-1">
        <Field.Label className='w-4xs'>{spell.name}</Field.Label>
        <Field.Value />
        <Field.Info className={getCastTimeColors(spell.castTime).text}>
          <div className="capitalize">{displayedText.action} <span className={getCastTimeColors(spell.castTime).text}>{spell.castTime.toLowerCase()}</span>. {spell.description}</div>
        </Field.Info>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="capitalize">{displayedText.power}: {powerName}</Badge>
        <Badge variant="outline" className="capitalize">{displayedText.cost}: {spell.cost}</Badge>
      </div>
    </div>
  );
}