"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { displayedText } from "@/common/translations";

type StyleFilterProps<T extends string> = 
{
  selectedStyle: T | "All";
  onStyleChange: (style: T | "All") => void;
  styles: readonly T[];
  label?: string;
};

export default function StyleFilter<T extends string>({ selectedStyle, onStyleChange, styles, label = "Style" }: StyleFilterProps<T>) 
{
  return (
    <div className="flex flex-col gap-2">
      <Select value={selectedStyle} onValueChange={value => onStyleChange(value as T | "All")}>
        
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="All">
            <span className="capitalize">{displayedText.all}</span>
          </SelectItem>

          {
            styles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)
          }
        </SelectContent>
      </Select>
    </div>
  );
}
