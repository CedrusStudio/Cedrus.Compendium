import { Field } from "@/common/components/fields";
import { displayedText } from "@/common/translations";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";
import { Mode } from "@/domain/characters/combat/Mode";
import { Character } from "@/domain/characters/Character";

export default function CharacterModesViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto">
          <DrawerHeader className="flex flex-col justify-around md:flex-row place-items-center flex-wrap">

          {
            character.stances.length > 0 && (
              <div className="flex flex-col gap-4 place-content-center place-items-center">

                <DrawerTitle className="capitalize">{displayedText.stances}</DrawerTitle>
                
                <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
                { character.stances.map(stance => <ModeView mode={stance} key={stance.id} />) }
                </div>

              </div>
            )
          }

          {
            character.states.length > 0 && (
              <div className="flex flex-col gap-4 place-content-center place-items-center">

                <DrawerTitle className="capitalize">{displayedText.states}</DrawerTitle>

                <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
                { character.states.map(state => <ModeView mode={state} key={state.id} />) }
                </div>

              </div>
            )
          }

          </DrawerHeader>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ModeView({ mode }: { mode: Mode })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md flex-1 min-h-12 min-w-40'>
      <Field value={mode.grade} className="gap-1">
        <Field.Label className='w-4xs'>{mode.name}</Field.Label>
        <Field.Value />
        <Field.Info>
          <span>{mode.description}</span>
        </Field.Info>
      </Field>
    </div>
  );
}