/**
 * Navigation sidebar for rulebook sections
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavigationNode } from '@/domain/rulebook/RulebookTypes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/accordion';

type RulebookSidebarProps = {
  navigation: NavigationNode[];
};

export function RulebookSidebar({ navigation }: RulebookSidebarProps) {
  const pathname = usePathname();
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  // Automatycznie otwórz kategorię dla aktualnej strony
  useEffect(() => {
    const currentCategory = navigation.find(cat => 
      cat.children?.some(section => pathname === `/rulebook/${section.slug}`)
    );
    
    if (currentCategory) {
      setOpenCategories(prev => {
        // Sprawdź czy kategoria już jest w stanie (zapobiega wielokrotnym dodaniom)
        if (prev.includes(currentCategory.id)) {
          return prev;
        }
        return [...prev, currentCategory.id];
      });
    }
    // POPRAWKA: usunięto openCategories z dependencies - to była przyczyna migotania
  }, [pathname, navigation]);

  return (
    <aside className="w-64 border-r h-[calc(100vh-4rem)] overflow-y-auto sticky top-16">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Spis Treści</h2>
        
        <Accordion 
          type="multiple" 
          className="space-y-2"
          value={openCategories}
          onValueChange={setOpenCategories}
        >
          {navigation.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <span>{category.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 ml-2">
                  {category.children?.map((section) => {
                    const isActive = pathname === `/rulebook/${section.slug}`;
                    return (
                      <li key={section.id}>
                        <Link
                          href={`/rulebook/${section.slug}`}
                          className={`
                            block px-3 py-1.5 text-sm rounded-md transition-colors
                            ${isActive 
                              ? 'bg-primary text-primary-foreground font-medium' 
                              : 'hover:bg-muted text-muted-foreground'
                            }
                          `}
                        >
                          {section.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </aside>
  );
}
