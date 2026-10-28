import { rollIcon } from "@/common/icons";
import { Button } from "@/ui/button";
import { displayedText } from '@/common/translations';

export type RollButtonProps = 
{
  onClick: () => void;
  rollResult: number | null;
};

export default function RollButton({ onClick, rollResult}: RollButtonProps)
{
  return (
    <Button variant='outline' onClick={onClick} aria-label={displayedText.roll} className="w-14 flex justify-center">
      <div>{rollIcon}</div>
      <div className="text-start">{rollResult}</div>
    </Button>
  );
};
