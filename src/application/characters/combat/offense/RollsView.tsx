import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { rollsIcon } from "@/presentation/icons";

export default function RollsView<T extends number | [number, boolean]>({ rolls, onReroll }: { rolls: T[], onReroll: (index: number) => void  }) 
{  
  if (rolls.length === 0) return null;

  return (
    <div className='flex flex-col items-center'>
      <div className='flex gap-x-1'>
      {
        rolls.map((roll, index) => 
        {
          const isTuple = Array.isArray(roll);
          const rollValue = isTuple ? roll[0] : roll;
          const isCritical = isTuple ? roll[1] : false;
          
          return (
            <Badge key={index} className={`flex flex-row rounded-full px-1 font-mono ${isCritical ? 'bg-yellow-300' : ''}`}>
              <div className='flex items-center gap-x-1'>
                <Button asChild variant="ghost" className="h-full w-full p-0 hover:bg-transparent hover:text-current" onClick={() => onReroll(index)}>
                  {rollsIcon()}
                </Button>
              </div>
              {rollValue}
            </Badge>
          );
        })
      }
      </div>
    </div>
  );
}
