"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { isValidTag } from "@/domain/Tag";

type TagFilterProps = 
{
  includedTags: string[];
  onTagsChange: (tags: string[]) => void;
};

export default function TagFilter({ includedTags, onTagsChange }: TagFilterProps) 
{
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string>("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => 
  {
    if (e.key === "Enter" && inputValue.trim()) 
    {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => 
  {
    const tag = inputValue.trim();
    if (!tag) return;

    if (!isValidTag(tag)) 
    {
      setError("Tag musi być małymi literami i nie może zawierać spacji");
      return;
    }

    if (includedTags.includes(tag))
    {
        setError("Tag jest już dodany");
        return;
    }

    if (!includedTags.includes(tag))
    {
        onTagsChange([...includedTags, tag]);
    }

    setInputValue("");
    setError("");
  };

  const removeIncludedTag = (tagToRemove: string) => 
  {
    onTagsChange(includedTags.filter(tag => tag !== tagToRemove));
  };

  const hasAnyTags = includedTags.length > 0;

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">

      <div className="flex gap-2 items-center">

        <Input type="text" placeholder={"Szukaj po tagu..."} value={inputValue} onChange={e => 
          {
            setInputValue(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          className={`flex-1 ${error ? "border-red-500" : ""}`}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!inputValue.trim()}>
          Add
        </Button>
        {
            hasAnyTags && (
                <div className="flex flex-row flex-wrap gap-2">
                {
                    includedTags.map(tag => (
                        <Button onClick={() => removeIncludedTag(tag)} type="button" key={tag} variant="default" size="sm">
                            <Badge variant="default" className="gap-1">
                                <span>{tag}</span>
                            </Badge>
                        </Button>
                    ))
                }
                </div>
            )
        }
      </div>

      { error &&  <p className="text-xs text-red-500">{error}</p> }
    </div>
  );
}
