"use client";

import { Button } from '@/ui/button';
import { usePersonalization } from '@/common/hooks/usePersonalization';
import { PersonalizationContext } from '@/persistence/slices/personalizationSlice';

type PersonalizedQuickTagsProps = {
  context: PersonalizationContext;
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
};

export default function PersonalizedQuickTags({ context, selectedTags, onSelectedTagsChange }: PersonalizedQuickTagsProps)
{
  const { hasApiKey, profile } = usePersonalization();
  const quickTags = profile.quickTagsByContext[context] ?? [];

  if (!hasApiKey || quickTags.length === 0)
  {
    return null;
  }

  const toggleTag = (tag: string) =>
  {
    if (selectedTags.includes(tag))
    {
      onSelectedTagsChange(selectedTags.filter(selectedTag => selectedTag !== tag));
      return;
    }

    onSelectedTagsChange([...selectedTags, tag]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Szybkie tagi</span>
      {
        quickTags.map(tag => (
          <Button
            key={tag}
            type="button"
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Button>
        ))
      }
    </div>
  );
}