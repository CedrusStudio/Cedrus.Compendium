import { immunityIcon, rollIcon } from "@/presentation/icons";
import { Button } from "@/ui/button";

export type RollButtonProps = 
{
  onClick: () => void;
  rollWithImmunityResult: number | null;
  immunity: number;
};

export default function RollWithImmunityButton({ onClick, rollWithImmunityResult, immunity }: RollButtonProps)
{
  return (
    <Button variant='outline' onClick={onClick} className="w-16 flex justify-center">
      <div className="flex flex-row justify-center items-center gap-0">
        <div>
            {Array.from({ length: immunity }).map((_, index) => <span key={index}>{immunityIcon("")}</span>)}
        </div>
        {rollIcon}
      </div>
      <div className="text-start">{rollWithImmunityResult}</div>
    </Button>
  );
};