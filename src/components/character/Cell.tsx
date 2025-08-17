import { Label } from "@/components/ui/label"

export type CellProps = 
{
  label: string;
  value: number;
};

export default function Cell({ label, value }: CellProps)
{
  return (
    <div className="flex border flex-col items-center justify-center mb-2 w-fit">
      <Label htmlFor={label} className="font-semibold columns-1 mb-2">{label}</Label>
      <div className="flex items-center justify-center border-2 border-black columns-2 h-7 w-7">
        <h1 className="font-medium">{value}</h1>
      </div>
    </div>
  );
};