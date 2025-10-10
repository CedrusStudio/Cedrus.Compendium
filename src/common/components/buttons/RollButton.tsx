import { rollIcon } from "@/domain/data/icons";
import { Button } from "@/ui/button";

export type RollButtonProps = 
{
  onClick: () => void;
  rollResult: number | null;
};

export default function RollButton({ onClick, rollResult }: RollButtonProps)
{
  return (
    <Button variant='outline' onClick={onClick} className="w-14 flex justify-center">
      <div>{rollIcon}</div>
      <div className="text-start">{rollResult}</div>
    </Button>
  );
};