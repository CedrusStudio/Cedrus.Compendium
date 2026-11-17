"use client";

import { ChevronDown } from 'lucide-react';
import { Button } from '@/ui/button';
import { type PersonalizationContext } from '@/common/personalization/personalizationProfile';
import PersonalizedQuickTags from './PersonalizedQuickTags';

type QuickTagsToggleProps = {
  open: boolean;
  controlsId: string;
  onOpenChange: (open: boolean) => void;
};

export function QuickTagsToggle({ open, controlsId, onOpenChange }: QuickTagsToggleProps)
{
  return (
    <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
      aria-expanded={open} aria-controls={controlsId} onClick={() => onOpenChange(!open)}>
      <ChevronDown aria-hidden="true" className={`size-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      Szybkie tagi
    </Button>
  );
}

type QuickTagsPanelProps = {
  id: string;
  open: boolean;
  context: PersonalizationContext;
  includedTags: string[];
  excludedTags: string[];
  onIncludedTagsChange: (tags: string[]) => void;
  onExcludedTagsChange: (tags: string[]) => void;
};

export function QuickTagsPanel({ id, open, context, includedTags, excludedTags, onIncludedTagsChange, onExcludedTagsChange }: QuickTagsPanelProps)
{
  return (
    <div id={id} hidden={!open} className="space-y-2" data-slot="quick-tags-panel">
      <PersonalizedQuickTags context={context} selectedTags={includedTags} onSelectedTagsChange={onIncludedTagsChange} />
      <PersonalizedQuickTags context={context} mode="exclude" selectedTags={excludedTags} onSelectedTagsChange={onExcludedTagsChange} />
    </div>
  );
}
