import { Button } from "../ui/button";
import { GiRollingDices } from "react-icons/gi";

export type RollButtonProps = 
{
  onClick: () => void;
  rollResult: number | null;
};

export default function RollButton({ onClick, rollResult }: RollButtonProps)
{
  return (
      <Button variant='outline' onClick={onClick} className="w-14 flex justify-center">
        <div><GiRollingDices /></div>
        <div className="text-start">{rollResult}</div>
      </Button>
  );
};