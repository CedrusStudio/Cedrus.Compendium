import { Label } from "@/ui/label"
import { displayedText } from '@/common/translations';
import { FieldPath } from 'react-hook-form';
import { MountDto } from '@/persistence/schemas/characters/equipment/mountSchema';
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { allowedHorsemanshipBonuses, allowedMountCenterSpeed, allowedMountGallopSpeed, allowedMountPaceSpeed } from "@/domain/characters/equipment/Mount";

type EditMountViewProps =
{
    pathPrefix?: string;
}

export default function MountEditableFields({ pathPrefix = ""}: EditMountViewProps)
{
  return (
    <>

        <div className="flex flex-col gap-3 px-4 place-items-center">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.horsemanshipBonus}</span></Label>

            <SelectFormField<MountDto> 
                path={(`${pathPrefix}horsemanshipBonus` as FieldPath<MountDto>)}
                items={allowedHorsemanshipBonuses}
                noLabel
            />
        </div>

        <div className="flex flex-row place-items-center place-content-center">
            <div className="grid auto-rows-min gap-3 px-4 justify-center">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.pace}</span></Label>

                <SelectFormField<MountDto> 
                    path={(`${pathPrefix}paceSpeed` as FieldPath<MountDto>)}
                    items={allowedMountPaceSpeed}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4 justify-center">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.gallop}</span></Label>

                <SelectFormField<MountDto> 
                    path={(`${pathPrefix}gallopSpeed` as FieldPath<MountDto>)}
                    items={allowedMountGallopSpeed}
                    noLabel
                />
                
            </div>

            <div className="grid auto-rows-min gap-3 px-4 justify-center">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.canter}</span></Label>

                <SelectFormField<MountDto> 
                    path={(`${pathPrefix}canterSpeed` as FieldPath<MountDto>)}
                    items={allowedMountCenterSpeed}
                    noLabel
                />
                    
            </div>
        </div>
    </>
  );
};
