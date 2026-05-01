import { Field } from "@/common/components/fields";
import { displayedText } from "@/common/translations";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";
import { Mode } from "@/domain/characters/combat/Mode";
import { Character } from "@/domain/characters/Character";

export default function CharacterModesViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  const hasModes = character.stances.length > 0 || character.states.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto">
          <DrawerHeader className="flex flex-col justify-around md:flex-row place-items-center flex-wrap">

          <div className="w-full text-center md:text-left">
            <DrawerTitle className="capitalize">{displayedText.showStancesStates}</DrawerTitle>
          </div>

          {
            !hasModes && <p className="text-sm text-muted-foreground">Brak postaw ani stanow.</p>
          }

          {
            character.stances.length > 0 && (
              <div className="flex flex-col gap-4 place-content-center place-items-center">

                <h3 className="text-foreground font-semibold capitalize">{displayedText.stances}</h3>
                
                <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
                { character.stances.map(stance => <ModeView mode={stance} key={stance.id} />) }
                </div>

              </div>
            )
          }

          {
            character.states.length > 0 && (
              <div className="flex flex-col gap-4 place-content-center place-items-center">

                <h3 className="text-foreground font-semibold capitalize">{displayedText.states}</h3>

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