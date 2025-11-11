/**
 * Component for rendering a complete rulebook section
 */

import type { RulebookSection } from '@/domain/rulebook/RulebookTypes';
import { ContentBlockRenderer } from '@/application/rulebook/ContentBlockRenderer';
import { Separator } from '@/ui/separator';

type RulebookSectionViewProps = {
  section: RulebookSection;
};

export function RulebookSectionView({ section }: RulebookSectionViewProps) {
  return (
    <article className="max-w-4xl mx-auto space-y-6">
      {/* Section Header */}
      <header className="border-b pb-4 mb-6">
        <h1 className="text-4xl font-bold mb-2">{section.title}</h1>
        {section.description && (
          <p className="text-lg text-muted-foreground">{section.description}</p>
        )}
      </header>

      {/* Main Content (before subsections) */}
      {section.content.length > 0 && (
        <div className="mb-6">
          {section.content.map((block) => (
            <ContentBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Subsections */}
      {section.subsections.map((subsection, idx) => (
        <section key={subsection.id} className="mb-8">
          <h2
            id={subsection.anchor}
            className="text-2xl font-bold mb-4 scroll-mt-20">
            {subsection.title}
          </h2>
          <div className="space-y-4">
            {subsection.content.map((block) => (
              <ContentBlockRenderer key={block.id} block={block} />
            ))}
          </div>
          {idx < section.subsections.length - 1 && (
            <Separator className="mt-8" />
          )}
        </section>
      ))}
    </article>
  );
}
