import { loadRulebookData } from '@/persistence/rulebook/rulebookLoader';
import { CategoryCard } from '@/application/rulebook/CategoryCard';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/ui/button';
import { RulebookCategory } from '@/domain/rulebook/RulebookTypes';

export default async function RulebookPage() 
{
  const rulebookData = loadRulebookData();
  
  const sectionCounts = rulebookData.categories.map(category => ({
    category,
    count: rulebookData.sections.filter(s => s.category === category.id).length
  }));

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <HeroSection />
      <CategoryCards sectionCounts={sectionCounts} />
      <QuickLinks />
    </div>
  );
}

function HeroSection() 
{
  return (
    <div className="text-center mb-12">

      <h1 className="text-5xl font-bold mb-4">Księga Zasad</h1>

      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Kompletny podręcznik zasad systemu RPG Cedrus. 
        Poznaj mechaniki, zasady walki, magię i wszystkie aspekty systemu.
      </p>
      
      <Link href="/rulebook/search">
        <Button size="lg" variant="outline">
          <Search className="mr-2 h-5 w-5" />
          Szukaj w podręczniku
        </Button>
      </Link>
      
    </div>
  );
}

function CategoryCards({ sectionCounts }: { sectionCounts: { category: RulebookCategory; count: number }[] })
{
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Kategorie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      { sectionCounts.map(({ category, count }) => <CategoryCard key={category.id} category={category} sectionCount={count} />) }
      </div>
  </div>
  );
};

function QuickLinks()
{
  return (
    <div className="border-t pt-12">
      <h2 className="text-2xl font-bold mb-6">Popularne sekcje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/rulebook/podstawy/rodzaje-kosci"
          className="p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <h3 className="font-semibold mb-1">🎲 Rodzaje Kości</h3>
          <p className="text-sm text-muted-foreground">Podstawowe mechaniki rzutów kośćmi</p>
        </Link>

        <Link 
          href="/rulebook/system-walki/mechanika-walki"
          className="p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <h3 className="font-semibold mb-1">⚔️ Mechanika Walki</h3>
          <p className="text-sm text-muted-foreground">Zasady prowadzenia walki</p>
        </Link>

        <Link 
          href="/rulebook/magia-i-zaklecia/zaklecia-i-czary"
          className="p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <h3 className="font-semibold mb-1">✨ Zaklęcia i Czary</h3>
          <p className="text-sm text-muted-foreground">System magii i czarowania</p>
        </Link>

        <Link 
          href="/rulebook/cechy-i-umiejetnosci/cechy"
          className="p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <h3 className="font-semibold mb-1">📊 Parametry Postaci</h3>
          <p className="text-sm text-muted-foreground">Atrybuty, cechy i umiejętności</p>
        </Link>
      </div>
    </div>
  );
}