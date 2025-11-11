import { loadSection, loadNavigation, loadCategorySections } from '@/persistence/rulebook/rulebookLoader';
import { RulebookSidebar } from '@/application/rulebook/RulebookSidebar';
import { RulebookSectionView } from '@/application/rulebook/RulebookSectionView';
import { TableOfContents } from '@/application/rulebook/TableOfContents';
import { notFound } from 'next/navigation';
import type { RulebookCategoryId } from '@/domain/rulebook/RulebookTypes';

type PageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export default async function SectionPage({ params }: PageProps) {
  const { category, slug } = await params;
  const section = loadSection(category as RulebookCategoryId, slug);
  
  if (!section) {
    notFound();
  }

  const navigation = loadNavigation();

  return (
    <div className="flex">
      <RulebookSidebar navigation={navigation} />
      
      <main className="flex-1">
        <RulebookSectionView section={section} />
      </main>

      <TableOfContents section={section} />
    </div>
  );
}

export async function generateStaticParams() {
  const categories = ['podstawy', 'cechy-i-umiejetnosci', 'system-walki', 'magia-i-zaklecia', 'zdrowie-i-regeneracja'];
  const params: Array<{ category: string; slug: string }> = [];

  categories.forEach((category) => {
    const sections = loadCategorySections(category as RulebookCategoryId);
    sections.forEach((section) => {
      params.push({
        category,
        slug: section.slug
      });
    });
  });

  return params;
}
