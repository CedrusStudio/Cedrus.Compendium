'use client';

import { useState } from 'react';
import { useRulebookSearch, useRulebookCategories } from '@/infrastructure/hooks/useRulebook';
import { Input } from '@/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import type { RulebookCategoryId, RulebookCategory, RulebookSection } from '@/domain/rulebook/RulebookTypes';
import { Spinner } from '@/common/components/ui/spinner';

export default function SearchPage() 
{
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RulebookCategoryId | undefined>(undefined);
  
  const { data: categories } = useRulebookCategories();
  const { data: results, isLoading } = useRulebookSearch(query, category);

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">

      <div className="mb-8">
        <p className="text-muted-foreground">Znajdź zasady, mechaniki i informacje w całym podręczniku Cedrus</p>
      </div>

      <SearchControls 
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          categories={categories}
      />

      <SearchResults
          query={query}
          results={results}
          isLoading={isLoading}
          categories={categories}
      />

    </div>
  );
}

type SearchControlsProps = 
{
    query: string;
    setQuery: (query: string) => void;
    category: RulebookCategoryId | undefined;
    setCategory: (category: RulebookCategoryId | undefined) => void;
    categories?: RulebookCategory[];
};

function SearchControls({ query, setQuery, category, setCategory, categories }: SearchControlsProps)
{
    return (
      <div className="flex gap-4 mb-8">

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />

          <Input
            type="text"
            placeholder="Szukaj w podręczniku..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={category || 'all'}
          onValueChange={(value) => setCategory(value === 'all' ? undefined : value as RulebookCategoryId)}
        >

          <SelectTrigger className="w-64">
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">Wszystkie kategorie</SelectItem>
            {
                categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.title}
                    </SelectItem>
                ))
            }
          </SelectContent>

        </Select>
      </div>
    );
}

type SearchResultsProps =
{
    query: string;
    results: RulebookSection[] | undefined;
    isLoading: boolean;
    categories?: RulebookCategory[];
};

function SearchResults({ query, results, isLoading, categories }: SearchResultsProps)
{
    if (query.length < 2) return <p className="text-center py-12 text-muted-foreground">Wpisz co najmniej 2 znaki aby rozpocząć wyszukiwanie</p>;
    if (isLoading) return <Spinner className="h-8 w-8 mx-auto mt-12" />;
    if (!results || results.length === 0) return <p className="text-center py-12 text-muted-foreground">Nie znaleziono wyników dla &quot;{query}&quot;</p>;

    return (
        <>
            <div className="mb-4 text-sm text-muted-foreground">Znaleziono {results.length} {results.length === 1 ? 'wynik' : 'wyników'}</div>
            
            <div className="flex flex-col gap-2">
            {
                results.map(section => 
                {
                    const categoryInfo = categories?.find(c => c.id === section.category);

                    return (
                        <Link key={section.id} href={`/rulebook/${categoryInfo?.slug}/${section.slug}`}>
                            <SearchResultCard section={section} categoryInfo={categoryInfo} />
                        </Link>
                    );
                })
            }
            </div>
        </>
    )
}

type SearchResultCardProps =
{
    section: RulebookSection;
    categoryInfo?: RulebookCategory;
};

function SearchResultCard({ section, categoryInfo }: SearchResultCardProps)
{
    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex items-start justify-between gap-4 flex-1">

                <CardTitle className="hover:text-primary transition-colors">
                    {section.title}
                </CardTitle>
                
                {
                    section.description && (
                        <CardDescription className="mt-2">
                        {section.description}
                        </CardDescription>
                    )
                }

                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{categoryInfo?.icon} {categoryInfo?.title}</Badge>
                </div>

            </CardHeader>
        </Card>
    );
}