/**
 * Table of contents component for section navigation
 */

'use client';

import { useEffect, useState } from 'react';
import type { RulebookSection } from '@/domain/rulebook/RulebookTypes';

type TableOfContentsProps = {
  section: RulebookSection;
};

export function TableOfContents({ section }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    // Observe all headings
    const headings = document.querySelectorAll('h2[id], h3[id], h4[id]');
    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, []);

  const toc = section.subsections.map(subsection => ({
    id: subsection.anchor,
    title: subsection.title,
    level: 2,
    children: subsection.content
      .filter(block => block.type === 'heading' && block.level >= 3)
      .map(block => {
        if (block.type === 'heading') {
          return {
            id: block.anchor,
            title: block.content,
            level: block.level
          };
        }
        return null;
      })
      .filter(Boolean)
  }));

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-20 w-64 h-fit">
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3 text-sm">Na tej stronie</h3>
        <ul className="space-y-2 text-sm">
          {toc.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`
                  block py-1 transition-colors
                  ${activeId === item.id 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {item.title}
              </a>
              {item.children && item.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1 border-l pl-3">
                  {item.children.map((child) => (
                    child && (
                      <li key={child.id}>
                        <a
                          href={`#${child.id}`}
                          className={`
                            block py-1 text-xs transition-colors
                            ${activeId === child.id 
                              ? 'text-primary font-medium' 
                              : 'text-muted-foreground hover:text-foreground'
                            }
                          `}
                        >
                          {child.title}
                        </a>
                      </li>
                    )
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
