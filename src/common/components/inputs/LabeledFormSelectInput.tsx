import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

type LabeledFormSelectInputProps =
{
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  collectionToSelectFrom: readonly string[];
  onChange: (e: string) => void;
  errors?: { [key: string]: string };
  type?: string;
}

export default function LabeledFormSelectInput({ name, label, placeholder, collectionToSelectFrom, value, onChange, errors }: LabeledFormSelectInputProps)
{
  return (
    <div className="grid gap-3 justify-center">
        <Label htmlFor={name} className="capitalize">{label}</Label>
        <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
        {   
            collectionToSelectFrom.map(item => (
                <SelectItem key={item} value={item}>
                    <span className="capitalize">{item}</span>
                </SelectItem>
            ))
        }
        </SelectContent>
        </Select>
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