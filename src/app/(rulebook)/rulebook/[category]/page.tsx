import { loadCategorySections, loadNavigation, loadCategory } from '@/persistence/rulebook/rulebookLoader';
import { RulebookSidebar } from '@/application/rulebook/RulebookSidebar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Book } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import type { RulebookCategoryId } from '@/domain/rulebook/RulebookTypes';

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryData = loadCategory(category as RulebookCategoryId);
  
  if (!categoryData) {
    notFound();
  }

  const sections = loadCategorySections(categoryData.id);
  const navigation = loadNavigation();

  return (
    <div className="flex">
      <RulebookSidebar navigation={navigation} />
      
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Category Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-6xl">{categoryData.icon}</span>
              <div>
                <h1 className="text-4xl font-bold">{categoryData.title}</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {categoryData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">
              Sekcje ({sections.length})
            </h2>
            
            <div className="grid gap-4">
              {sections.map((section) => (
                <Link 
                  key={section.id}
                  href={`/rulebook/${categoryData.slug}/${section.slug}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary transition-colors flex items-center gap-2">
                            <Book className="h-5 w-5" />
                            {section.title}
                          </CardTitle>
                          {section.description && (
                            <CardDescription className="mt-2">
                              {section.description}
                            </CardDescription>
                          )}
                          {section.subsections.length > 0 && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              {section.subsections.length} podsekcji
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return [
    { category: 'podstawy' },
    { category: 'cechy-i-umiejetnosci' },
    { category: 'system-walki' },
    { category: 'magia-i-zaklecia' },
    { category: 'zdrowie-i-regeneracja' },
  ];
}
