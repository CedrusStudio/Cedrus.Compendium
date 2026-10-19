'use client';

import { Tabs, TabsList, TabsTrigger } from '@/ui/tabs';
import { displayedText } from '@/common/translations';
import type { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

type CharacterVisibilityFilterProps =
{
  value: CharacterVisibilityMode;
  onValueChange: (mode: CharacterVisibilityMode) => void;
  mineOnlyDisabled: boolean;
};

export default function CharacterVisibilityFilter({ value, onValueChange, mineOnlyDisabled }: CharacterVisibilityFilterProps)
{
  return (
    <Tabs className="max-w-full shrink-0" value={value} onValueChange={(v) => onValueChange(v as CharacterVisibilityMode)}>
      <TabsList className="h-auto flex-wrap overflow-visible">
        <TabsTrigger value="all">{displayedText.characterVisibilityAll}</TabsTrigger>
        <TabsTrigger value="mineOnly" disabled={mineOnlyDisabled}>{displayedText.characterVisibilityMineOnly}</TabsTrigger>
        <TabsTrigger value="publicOnly">{displayedText.characterVisibilityPublicOnly}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
