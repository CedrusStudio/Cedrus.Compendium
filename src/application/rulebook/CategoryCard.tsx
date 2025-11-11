/**
 * Category card for rulebook landing page
 */

import Link from 'next/link';
import type { RulebookCategory } from '@/domain/rulebook/RulebookTypes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { ArrowRight } from 'lucide-react';

type CategoryCardProps = {
  category: RulebookCategory;
  sectionCount: number;
};

export function CategoryCard({ category, sectionCount }: CategoryCardProps) {
  return (
    <Link href={`/rulebook/${category.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-4xl">{category.icon}</span>
            <span className="text-sm text-muted-foreground">
              {sectionCount} sekcji
            </span>
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {category.title}
          </CardTitle>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
            Przeglądaj
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
