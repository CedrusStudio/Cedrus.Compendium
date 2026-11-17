"use client";

import { Button } from '@/ui/button';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { type PersonalizationContext } from '@/common/personalization/personalizationProfile';

type PersonalizedQuickTagsProps = {
  context: PersonalizationContext;
  mode?: 'include' | 'exclude';
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
};

export default function PersonalizedQuickTags({ context, mode = 'include', selectedTags, onSelectedTagsChange }: PersonalizedQuickTagsProps)
{
  const { hasApiKey, profile } = usePersonalization();
  const quickTags = mode === 'exclude'
    ? (profile.quickExcludeTagsByContext[context] ?? [])
    : (profile.quickTagsByContext[context] ?? []);

  if (!hasApiKey || quickTags.length === 0)
  {
    return null;
  }

  const label = mode === 'exclude' ? 'Szybkie tagi wykluczające' : 'Szybkie tagi dołączające';

  const toggleTag = (tag: string) =>
  {
    if (selectedTags.includes(tag))
    {
      onSelectedTagsChange(selectedTags.filter(selectedTag => selectedTag !== tag));
      return;
    }

    onSelectedTagsChange([...selectedTags, tag]);
  };

  // Only touch this mode's quick tags — selectedTags may also hold tags added
  // elsewhere (e.g. the main TagFilter), which "select/deselect all" here must not disturb.
  const allSelected = quickTags.every(tag => selectedTags.includes(tag));

  const selectAllQuickTags = () =>
  {
    onSelectedTagsChange([...selectedTags, ...quickTags.filter(tag => !selectedTags.includes(tag))]);
  };

  const deselectAllQuickTags = () =>
  {
    onSelectedTagsChange(selectedTags.filter(tag => !quickTags.includes(tag)));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      {
        quickTags.map(tag => (
          <Button
            key={tag}
            type="button"
            variant={selectedTags.includes(tag) ? (mode === 'exclude' ? 'destructive' : 'default') : 'outline'}
            size="sm"
            aria-pressed={selectedTags.includes(tag)}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Button>
        ))
      }
      {
        quickTags.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={allSelected ? deselectAllQuickTags : selectAllQuickTags}
          >
            {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
          </Button>
        )
      }
    </div>
  );
}
