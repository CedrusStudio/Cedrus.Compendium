import type { RulebookSection } from '@/domain/rulebook/RulebookTypes';
import { ContentBlockRenderer } from '@/application/rulebook/ContentBlockRenderer';
import { Separator } from '@/ui/separator';

type RulebookSectionViewProps = 
{
  section: RulebookSection;
};

export function RulebookSectionView({ section }: RulebookSectionViewProps) 
{
  return (
    <article className="w-3xl space-y-6">
      <SectionHeader section={section} />
      <SectionContent section={section} />
      <SubsectionContent section={section} />
    </article>
  );
}

function SectionHeader({ section }: { section: RulebookSection })
{
  return (
    <header className="border-b pb-4 mb-6">
      <h1 className="text-4xl font-bold mb-2">{section.title}</h1>
      { section.description && <p className="text-lg text-muted-foreground">{section.description}</p> }
    </header>
  )
}

function SectionContent({ section }: { section: RulebookSection })
{
  return (
    <>
    {
      section.content.length > 0 && (
        <div className="mb-6">
        { section.content.map(block => <ContentBlockRenderer key={block.id} block={block} />) }
        </div>
      )
    }
    </>
  )
}

function SubsectionContent({ section }: { section: RulebookSection })
{
  return (
    <>
    {
      section.subsections.map((subsection, index) => (
        <section key={subsection.id} className="mb-6">
          <h2 id={subsection.anchor} className="text-2xl font-bold mb-4 scroll-mt-20">
            {subsection.title}
          </h2>

          <div className="space-y-4">
            { subsection.content.map(block => <ContentBlockRenderer key={block.id} block={block} /> ) }
          </div>

          { index < section.subsections.length - 1 && <Separator className="mt-6" /> }
        </section>
      ))
    }
    </>
  )
};