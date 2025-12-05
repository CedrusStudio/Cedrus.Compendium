'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRulebookSearch, useRulebookCategories } from '@/infrastructure/hooks/useRulebook';
import { displayedText } from '@/common/translations';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/common/components/ui/command';
import { Badge } from '@/ui/badge';
import type { RulebookCategory, RulebookCategoryId, RulebookSection } from '@/domain/rulebook/RulebookTypes';

export function RulebookSearchCommand() 
{
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RulebookCategoryId | undefined>(undefined);
  
  const router = useRouter();
  const { data: categories } = useRulebookCategories();
  const { data: results, isLoading } = useRulebookSearch(debouncedQuery, selectedCategory);

  useEffect(() => 
  {
    const timer = setTimeout(() => { setDebouncedQuery(query); }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => 
  {
    const down = (e: KeyboardEvent) => 
    {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) 
      {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset query when dialog closes
  useEffect(() => 
  {
    if (!open) 
    {
      setQuery('');
      setDebouncedQuery('');
      setSelectedCategory(undefined);
    }
  }, [open]);

  const handleSelectSection = useCallback((categorySlug: string, sectionSlug: string) => 
  {
    setOpen(false);
    router.push(`/rulebook/${categorySlug}/${sectionSlug}`);
  }, [router]);

  const handleSelectCategory = useCallback((categoryId: RulebookCategoryId) => 
  {
    setSelectedCategory(categoryId === selectedCategory ? undefined : categoryId);
  }, [selectedCategory]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>

      <CommandInput 
        placeholder={displayedText.searchPlaceholder} 
        value={query}
        onValueChange={setQuery}
      />

      <CommandList>

        <CommandEmpty>
          {isLoading ? 'Szukam...' : displayedText.searchNoResults}
        </CommandEmpty>

        { 
            (!debouncedQuery && categories) && (
                <CategoryGroup categories={categories} handleSelectCategory={handleSelectCategory} selectedCategory={selectedCategory} /> 
            )
        }

        <SearchResults 
            results={results}
            categories={categories}
            handleSelectSection={handleSelectSection}
        />

      </CommandList>
    </CommandDialog>
  );
}

type CategoryGroupProps =
{
    categories: RulebookCategory[]
    handleSelectCategory: (categoryId: RulebookCategoryId) => void;
    selectedCategory: RulebookCategoryId | undefined;
}

function CategoryGroup({ categories, handleSelectCategory, selectedCategory }: CategoryGroupProps)
{
    return (
        <CommandGroup heading="Kategorie">
        {
            categories.map(category => (
                <CommandItem
                    key={category.id}
                    value={category.id}
                    onSelect={() => handleSelectCategory(category.id)}
                    className="cursor-pointer"
                >
                    <span className="mr-2">{category.icon}</span>
                    <span>{category.title}</span>

                    {selectedCategory === category.id && <Badge variant="secondary" className="ml-auto">Wybrano</Badge>}
                </CommandItem>
            ))
        }
        </CommandGroup>
    );
}

type SearchResultsProps =
{
    results?: RulebookSection[];
    categories?: RulebookCategory[];
    handleSelectSection: (categorySlug: string, sectionSlug: string) => void;
};

function SearchResults({  results, categories, handleSelectSection }: SearchResultsProps)
{
    if (!results || results.length === 0) return null;

    return (
        <CommandGroup heading={`Wyniki (${results.length})`}>
        {
            results.map((section, index) => 
            {
                const categoryInfo = categories?.find(c => c.id === section.category);
                
                return (
                    <CommandItem
                        key={`${section.id}-${index}`}
                        value={`${section.title} ${section.description || ''}`}
                        onSelect={() => handleSelectSection(categoryInfo?.slug || '', section.slug)}
                        className="cursor-pointer"
                    >

                    <div className="flex flex-col flex-1 gap-1">
                        <div className="flex items-center gap-2">
                        <span className="font-medium">{section.title}</span>
                            {categoryInfo && <Badge variant="secondary" className="text-xs">{categoryInfo.icon} {categoryInfo.title}</Badge> }
                        </div>
                    </div>
                    </CommandItem>
                );
            })
        }
        </CommandGroup>
    )
}