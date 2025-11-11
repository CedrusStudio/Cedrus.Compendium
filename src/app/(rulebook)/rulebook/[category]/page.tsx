import { loadCategorySections, loadCategory } from '@/persistence/rulebook/rulebookLoader';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Book } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import type { RulebookCategory, RulebookCategoryId, RulebookSection } from '@/domain/rulebook/RulebookTypes';

type PageProps = { params: Promise<{ category: string; }> };

export default async function CategoryPage({ params }: PageProps) 
{
  const { category } = await params;
  const categoryData = loadCategory(category as RulebookCategoryId);
  if (!categoryData) notFound();

  const sections = loadCategorySections(categoryData.id);

  return (
      <section className="max-w-5xl">
        <CategoryHeader categoryData={categoryData} />

        <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold mb-2">Sekcje ({sections.length})</h2>
            { sections.map(section => <SectionView key={section.id} section={section} categoryData={categoryData} />) }
        </div>

      </section>
  );
}

type CategoryHeaderProps = 
{
  categoryData: RulebookCategory;
};

function CategoryHeader({ categoryData }: CategoryHeaderProps) 
{
    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-6xl">{categoryData.icon}</span>

                <div>
                    <h1 className="text-3xl font-bold">{categoryData.title}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{categoryData.description}</p>
                </div>
            </div>
        </div>
    )
}

type CategorySectionProps = 
{
    section: RulebookSection;
    categoryData: RulebookCategory;
};

function SectionView({ section, categoryData }: CategorySectionProps)
{
    return (
        <Link href={`/rulebook/${categoryData.slug}/${section.slug}`}>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader  className="flex items-start justify-between flex-1">
                    <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        {section.title}
                    </CardTitle>

                    {
                        section.description && (
                            <CardDescription className="mt-2">
                                {section.description}
                            </CardDescription>
                        )
                    }

                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardHeader>
            </Card>

        </Link>
    );
}