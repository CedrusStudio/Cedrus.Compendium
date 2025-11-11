/**
 * Client-side hooks for rulebook data fetching
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { RulebookData, RulebookSection, RulebookCategory, RulebookCategoryId, NavigationNode } from '@/domain/rulebook/RulebookTypes';

/**
 * Fetch complete rulebook data
 */
export function useRulebookData() 
{
  return useQuery<RulebookData>
  ({
    queryKey: ['rulebook', 'complete'],
    queryFn: async () => 
    {
      const response = await fetch('/data/rulebook/rulebook-complete.json');
      if (!response.ok) throw new Error('Failed to load rulebook data');
      return response.json();
    },
    staleTime: Infinity, // Data doesn't change
    gcTime: 1000 * 60 * 60 // 1 hour
  });
}

/**
 * Fetch sections for a category
 */
export function useCategorySections(categoryId: RulebookCategoryId) 
{
  return useQuery<RulebookSection[]>
  ({
    queryKey: ['rulebook', 'category', categoryId],
    queryFn: async () => 
    {
      const response = await fetch(`/data/rulebook/${categoryId}.json`);
      if (!response.ok) throw new Error(`Failed to load category: ${categoryId}`);
      const data = await response.json();
      return data.sections;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60
  });
}

/**
 * Fetch a specific section
 */
export function useRulebookSection(categoryId: RulebookCategoryId, slug: string) 
{
  const { data: sections, ...rest } = useCategorySections(categoryId);
  
  return {
    ...rest,
    data: sections?.find(s => s.slug === slug) || null
  };
}

/**
 * Fetch navigation tree
 */
export function useRulebookNavigation() 
{
  return useQuery<NavigationNode[]>({
    queryKey: ['rulebook', 'navigation'],
    queryFn: async () => 
    {
      const response = await fetch('/data/rulebook/rulebook-complete.json');
      if (!response.ok) throw new Error('Failed to load navigation');
      const data = await response.json();
      return data.navigation;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60
  });
}

/**
 * Fetch all categories
 */
export function useRulebookCategories() 
{
  return useQuery<RulebookCategory[]>
  ({
    queryKey: ['rulebook', 'categories'],
    queryFn: async () => {
      const response = await fetch('/data/rulebook/rulebook-complete.json');
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      return data.categories;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60
  });
}

/**
 * Search sections
 */
export function useRulebookSearch(query: string, categoryId?: RulebookCategoryId) 
{
  return useQuery<RulebookSection[]>
  ({
    queryKey: ['rulebook', 'search', query, categoryId],
    queryFn: async () => {
      const response = await fetch('/data/rulebook/rulebook-complete.json');
      if (!response.ok) throw new Error('Failed to search');
      const data: RulebookData = await response.json();
      
      const lowerQuery = query.toLowerCase();
      let sections = data.sections;
      
      if (categoryId) {
        sections = sections.filter(s => s.category === categoryId);
      }
      
      return sections.filter(section => 
      {
        // Search in title
        if (section.title.toLowerCase().includes(lowerQuery)) return true;

        // Search in content
        const contentText = section.content
          .map(block => 
          {
            if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'blockquote') 
            {
              return block.content;
            }

            if (block.type === 'list') 
            {
              return block.items.join(' ');
            }

            if (block.type === 'table') 
            {
              return block.table.headers.join(' ') + ' ' + block.table.rows.flat().join(' ');
            }
            
            return '';
          })
          .join(' ')
          .toLowerCase();

        return contentText.includes(lowerQuery);
      });
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}
