import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import { getCastTimeColors } from "@/presentation/colors";
import { displayedText } from "@/presentation/translations";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/ui/drawer";
import { Character } from "@/domain/characters/Character";

export default function CharacterManeuversViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto">
        <DrawerHeader className="flex flex-col place-content-center place-items-center flex-wrap">
        {
          character.maneuvers.length > 0 && (
            <div className="flex flex-col gap-4 place-content-center place-items-center">
              <DrawerTitle className="capitalize">{displayedText.maneuvers}</DrawerTitle>
              
              <div className="flex flex-row flex-wrap md:grid md:grid-cols-4 gap-3 items-center justify-center">
              { character.maneuvers.map(maneuver => <ManeuverView maneuver={maneuver} key={maneuver.id} />) }
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

function ManeuverView({ maneuver }: { maneuver: Maneuver })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md flex-1 min-h-12 min-w-40'>
      <FieldViewWithInfo
        value={maneuver.grade}
        infoContent={<span className="capitalize">{displayedText.action} <span className={`${getCastTimeColors(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
        infoTriggerClassName={`${getCastTimeColors(maneuver.castTime).text}`}
      >
        {maneuver.name}
      </FieldViewWithInfo>
    </div>
  );
}