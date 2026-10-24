import { Label } from "@/ui/label";
import { Input } from "@/ui/input";

type LabeledFormInputProps =
{
  name: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: { [key: string]: string };
  type?: string;
  placeholder?: string;
}

export default function LabeledFormInput({ name, label, value, onChange, errors, placeholder, type }: LabeledFormInputProps)
{
  const isNumber = typeof value === "number";

  return (
    <div className="grid gap-2 justify-center">
        <Label htmlFor={name} className="capitalize">{label}</Label>
        <Input id={name} name={name} type={type ?? (isNumber ? "number" : "text")} value={value} onChange={onChange} placeholder={placeholder} />
        {
          errors?.[name] && (
            <p id={`${name}-error`} className="text-sm font-medium text-destructive">
                {errors[name]}
            </p>
          )
        }
    </div>
  );
};
