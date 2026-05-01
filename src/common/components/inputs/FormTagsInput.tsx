"use client";

import { FormControl, FormField, FormItem, FormMessage } from "@/ui/form";
import { useState } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { CharacterTag, isValidTag, SessionTagPrefix } from "@/domain/Tag";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { displayedText } from "@/common/translations";
import { addIcon } from "@/common/icons";
import SessionTagDropdown from "@/common/components/inputs/SessionTagDropdown";
import ExistingTagDropdown from "@/common/components/inputs/ExistingTagDropdown";
import { EntityType } from "@/common/hooks/useEntityTags";

export type FormTagsInputProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  placeholder?: string;
  maxTags?: number;
  beAbleToSetCharacterAndSessionTags?: boolean;
  entityType?: EntityType;
};

export function FormTagsInput<TFieldValues extends FieldValues>({ path, placeholder = displayedText.addTag, maxTags = 15, beAbleToSetCharacterAndSessionTags = false, entityType }: FormTagsInputProps<TFieldValues>) 
{
  const { control } = useFormContext<TFieldValues>();
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  return (
    <FormField
      control={control}
      name={path}
      render={({ field }) => 
      {
        const tags = (Array.isArray(field.value) ? field.value : []) as string[];

        const handleAddTag = (prefix?: string) => 
        {
          const trimmedValue = (prefix ?? "") + inputValue.trim();
          setValidationError(null); // Clear previous validation error
          
          if (!trimmedValue) 
          {
            setValidationError(displayedText.tagCannotBeEmpty);
            return;
          }

          if (!isValidTag(trimmedValue)) 
          {
            setValidationError(displayedText.tagMustBeLowercaseAndSingleWord);
            return;
          }

          if (tags.includes(trimmedValue)) 
          {
            setValidationError(displayedText.tagAlreadyExists);
            return;
          }

          if (tags.length >= maxTags) 
          {
            setValidationError(`${displayedText.maximum} ${maxTags} ${displayedText.tagsAllowed}`);
            return;
          }

          field.onChange([...tags, trimmedValue]);
          setInputValue("");
        };

        const handleAddCharacterTag = () => 
        {
          handleAddTag(CharacterTag);
        };

        const handleSelectSessionTag = (tag: string) => 
        {
          if (tags.includes(tag)) 
          {
            setValidationError(displayedText.tagAlreadyExists);
            return;
          }

          if (tags.length >= maxTags) 
          {
            setValidationError(`${displayedText.maximum} ${maxTags} ${displayedText.tagsAllowed}`);
            return;
          }

          field.onChange([...tags, tag]);
          setValidationError(null);
        };

        const handleRemoveTag = (tagToRemove: string) => 
        {
          field.onChange(tags.filter((tag) => tag !== tagToRemove));
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => 
        {
          if (e.key === "Enter") 
          {
            e.preventDefault();
            handleAddTag();
          }
        };

        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col flex-wrap md:flex-row gap-2 place-items-center place-content-center">

                  <div className="flex flex-row gap-2">
                    <Input
                      type="text"
                      value={inputValue}
                      onChange={e => 
                        {
                          setInputValue(e.target.value);
                          setValidationError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-46"
                        />

                    <Button type="button" onClick={() => handleAddTag()} variant="outline">
                      {addIcon("scale-90")}
                    </Button>
                  </div>

                  {
                    beAbleToSetCharacterAndSessionTags && (
                      <>
                        <SessionTagDropdown 
                          currentTags={tags}
                          maxTags={maxTags}
                          onSelectTag={handleSelectSessionTag}
                        />

                        <Button type="button" onClick={() => handleAddTag(SessionTagPrefix)} variant="outline">
                          {"Użyj prefix 'sesja-'"}
                        </Button>

                        <Button type="button" onClick={handleAddCharacterTag} variant="outline">
                          {"Dodaj tag 'postać'"}
                        </Button>
                      </>
                    )
                  }

                  {
                    entityType && (
                      <ExistingTagDropdown
                        entityType={entityType}
                        currentTags={tags}
                        maxTags={maxTags}
                        onSelectTag={tag => 
                        {
                          if (tags.includes(tag)) 
                          {
                            setValidationError(displayedText.tagAlreadyExists);
                            return;
                          }
                          field.onChange([...tags, tag]);
                          setValidationError(null);
                        }}
                      />
                    )
                  }
                </div>

                { validationError && <p className="text-sm font-medium text-destructive flex place-content-center">{validationError}</p> }

                {
                  tags.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                    {
                      tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                            aria-label={`Remove ${tag}`}
                          >
                            {tag}
                          </button>
                        </Badge>
                      ))
                    }
                    </div>
                  )
                }
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default FormTagsInput;
