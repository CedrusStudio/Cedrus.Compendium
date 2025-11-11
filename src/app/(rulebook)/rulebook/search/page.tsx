/**
 * Search page for rulebook content
 */

'use client';

import { useState } from 'react';
import { useRulebookSearch, useRulebookCategories } from '@/infrastructure/hooks/useRulebook';
import { Input } from '@/ui/input';
import { Search, Loader2, Book } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Badge } from '@/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import type { RulebookCategoryId } from '@/domain/rulebook/RulebookTypes';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RulebookCategoryId | undefined>(undefined);
  
  const { data: categories } = useRulebookCategories();
  const { data: results, isLoading } = useRulebookSearch(query, category);

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Przeszukaj Podręcznik</h1>
        <p className="text-muted-foreground">
          Znajdź zasady, mechaniki i informacje w całym podręczniku Cedrus
        </p>
      </div>

      {/* Search Controls */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj w podręczniku..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div>
        {query.length < 2 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Wpisz co najmniej 2 znaki aby rozpocząć wyszukiwanie</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Szukam...</p>
          </div>
        ) : !results || results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Nie znaleziono wyników dla &quot;{query}&quot;</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Znaleziono {results.length} {results.length === 1 ? 'wynik' : 'wyników'}
            </div>
            
            <div className="space-y-4">
              {results.map((section) => {
                const categoryInfo = categories?.find(c => c.id === section.category);
                return (
                  <Link 
                    key={section.id}
                    href={`/rulebook/${categoryInfo?.slug}/${section.slug}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                {categoryInfo?.icon} {categoryInfo?.title}
                              </Badge>
                            </div>
                            <CardTitle className="hover:text-primary transition-colors">
                              {section.title}
                            </CardTitle>
                            {section.description && (
                              <CardDescription className="mt-2">
                                {section.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
