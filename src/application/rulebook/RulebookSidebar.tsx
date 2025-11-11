'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavigationNode } from '@/domain/rulebook/RulebookTypes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/accordion';

type RulebookSidebarProps = 
{
  navigation: NavigationNode[];
};

export function RulebookSidebar({ navigation }: RulebookSidebarProps) 
{
  const pathname = usePathname();

  const currentCategory = navigation.find
  (
    category => category.children?.some(section => pathname === `/rulebook/${section.slug}`)
  );

  const defaultOpenCategories = currentCategory ? [currentCategory.id] : [];

  return (
    <aside className="hidden md:block w-64 border-r h-[calc(100vh-4rem)] overflow-y-auto sticky top-16 p-4">
        <Accordion type="multiple" className="space-y-2" defaultValue={defaultOpenCategories}>
            { navigation.map(category => <NavbarItem key={category.id} category={category} pathname={pathname} />) }
        </Accordion>
    </aside>
  );
}

type NavbarItemProps = 
{
  category: NavigationNode;
  pathname: string;
};

function NavbarItem({ category, pathname }: NavbarItemProps)
{
    return (
        <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                {category.title}
            </AccordionTrigger>

            <AccordionContent>
                <ul className="space-y-1 ml-1">
                {
                    category.children?.map(section => 
                    {
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
                    })
                }
                </ul>
            </AccordionContent>
        </AccordionItem>
    )
};