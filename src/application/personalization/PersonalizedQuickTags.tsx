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
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Button>
        ))
      }
    </div>
  );
}