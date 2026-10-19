import { loadSection } from '@/persistence/rulebook/rulebookLoader';
import { RulebookSectionView } from '@/application/rulebook/RulebookSectionView';
import { TableOfContents } from '@/application/rulebook/TableOfContents';
import { notFound } from 'next/navigation';
import type { RulebookCategoryId } from '@/domain/rulebook/RulebookTypes';

type PageProps = 
{
  params: Promise<{ category: string; slug: string; }>;
};

export default async function SectionPage({ params }: PageProps) 
{
  const { category, slug } = await params;
  const section = loadSection(category as RulebookCategoryId, slug);
  if (!section) notFound();

  return (
    <section className="min-w-0 flex flex-col items-start gap-4 lg:flex-row">
        <RulebookSectionView section={section} />
        <TableOfContents section={section} />
    </section>
  );
}