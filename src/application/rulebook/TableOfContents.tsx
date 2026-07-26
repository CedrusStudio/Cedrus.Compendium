/**
 * Table of contents component for section navigation
 */

'use client';

import { useEffect, useState } from 'react';
import type { RulebookSection } from '@/domain/rulebook/RulebookTypes';

type TableOfContentsProps = 
{
  section: RulebookSection;
};

type TocItem = 
{
  id: string;
  title: string;
  level: number;
  children: TocChild[];
};

type TocChild = 
{
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
};

const INTERSECTION_CONFIG = 
{
  rootMargin: '-80px 0px -80% 0px'
} as const;

const HEADING_SELECTORS = 'h2[id], h3[id], h4[id]';

export function TableOfContents({ section }: TableOfContentsProps) 
{
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => 
  {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => 
    {
      entries.forEach((entry) => 
      {
        if (entry.isIntersecting) setActiveHeadingId(entry.target.id);
      });
    };

    const observer = new IntersectionObserver(handleIntersection, INTERSECTION_CONFIG);
    
    const headingElements = document.querySelectorAll(HEADING_SELECTORS);
    headingElements.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const tableOfContents = buildTableOfContents(section);

  if (tableOfContents.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-20 w-64 ml-20">
      <ul className="space-y-2 text-sm border rounded-lg p-4">
        { tableOfContents.map(item => <TocMainItem key={item.id} item={item} activeHeadingId={activeHeadingId} /> ) }
      </ul>
    </nav>
  );
}

function buildTableOfContents(section: RulebookSection): TocItem[]
{
  return section.subsections.map((subsection, index) =>
  ({
    id: subsection.anchor || `subsection-${index}`,
    title: subsection.title,
    level: 2,
    children: extractChildHeadings(subsection.content)
  }));
}

function extractChildHeadings(content: RulebookSection['subsections'][0]['content']): TocChild[] 
{
  return content
    .filter((block) => block.type === 'heading' && block.level >= 3)
    .map((block, index) =>
    {
      if (block.type === 'heading')
      {
        return {
          id: block.anchor || `heading-${index}`,
          title: block.content,
          level: block.level
        };
      }
      return null;
    })
    .filter((item): item is TocChild => item !== null);
}

type TocMainItemProps = 
{
  item: TocItem;
  activeHeadingId: string;
};

function TocMainItem({ item, activeHeadingId }: TocMainItemProps) 
{
  const isActive = activeHeadingId === item.id;
  const hasChildren = item.children.length > 0;

  return (
    <li>
      <a
        href={`#${item.id}`}
        className={`
          block py-1 transition-colors
          ${isActive 
            ? 'text-primary font-medium' 
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        {item.title}
      </a>
      {
        hasChildren && (
          <ul className="ml-3 mt-1 space-y-1 border-l pl-3">
              { item.children.map((child) => <TocChildItem key={child.id} child={child} activeHeadingId={activeHeadingId} />)}
          </ul>
        )
      }
    </li>
  );
}

type TocChildItemProps = 
{
  child: TocChild;
  activeHeadingId: string;
};

function TocChildItem({ child, activeHeadingId }: TocChildItemProps) 
{
  const isActive = activeHeadingId === child.id;

  return (
    <li>
      <a
        href={`#${child.id}`}
        className={`
          block py-1 text-xs transition-colors
          ${isActive 
            ? 'text-primary font-medium' 
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        {child.title}
      </a>
    </li>
  );
}
