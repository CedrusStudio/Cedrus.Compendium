import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

type LabeledFormSelectInputProps<TValue> =
{
  name: string;
  label: string;
  value: TValue;
  placeholder?: string;
  collectionToSelectFrom: readonly TValue[];
  onChange: (e: TValue) => void;
  errors?: { [key: string]: string };
  type?: string;
  isValueCapitalized?: boolean;
}

export default function LabeledFormSelectInput<TValue extends string>({ name, label, placeholder, collectionToSelectFrom, value, onChange, errors, isValueCapitalized = true }: LabeledFormSelectInputProps<TValue>)
{
  return (
    <div className="flex flex-col items-center flex-1 gap-3 justify-center">
      <Label htmlFor={name} className="capitalize">{label}</Label>
      <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
      {   
        collectionToSelectFrom.map(item => (
          <SelectItem key={item} value={item}>
            <span className={isValueCapitalized ? "capitalize" : ""}>{item}</span>
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