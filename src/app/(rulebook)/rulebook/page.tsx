import { loadRulebookData } from '@/persistence/rulebook/rulebookLoader';
import { CategoryCard } from '@/application/rulebook/CategoryCard';
import { Book, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/ui/button';

export default async function RulebookPage() {
  const rulebookData = loadRulebookData();
  
  // Count sections per category
  const sectionCounts = rulebookData.categories.map(category => ({
    category,
    count: rulebookData.sections.filter(s => s.category === category.id).length
  }));

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center mb-4">
          <Book className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Cedrus System Rulebook</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Kompletny podręcznik zasad systemu RPG Cedrus. 
          Poznaj mechaniki, zasady walki, magię i wszystkie aspekty systemu.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Link href="/rulebook/search">
            <Button size="lg" variant="outline">
              <Search className="mr-2 h-5 w-5" />
              Szukaj w podręczniku
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-6 border rounded-lg">
          <div className="text-4xl font-bold text-primary mb-2">
            {rulebookData.sections.length}
          </div>
          <div className="text-sm text-muted-foreground">Sekcji zasad</div>
        </div>
        <div className="text-center p-6 border rounded-lg">
          <div className="text-4xl font-bold text-primary mb-2">
            {rulebookData.categories.length}
          </div>
          <div className="text-sm text-muted-foreground">Kategorii</div>
        </div>
        <div className="text-center p-6 border rounded-lg">
          <div className="text-4xl font-bold text-primary mb-2">100%</div>
          <div className="text-sm text-muted-foreground">Kompletność</div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Kategorie Zasad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectionCounts.map(({ category, count }) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              sectionCount={count} 
            />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-t pt-12">
        <h2 className="text-2xl font-bold mb-6">Popularne sekcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/rulebook/podstawy/rodzaje-kosci"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold mb-1">🎲 Rodzaje Kości</h3>
            <p className="text-sm text-muted-foreground">
              Podstawowe mechaniki rzutów kośćmi
            </p>
          </Link>
          <Link 
            href="/rulebook/system-walki/mechanika-walki"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold mb-1">⚔️ Mechanika Walki</h3>
            <p className="text-sm text-muted-foreground">
              Zasady prowadzenia walki
            </p>
          </Link>
          <Link 
            href="/rulebook/magia-i-zaklecia/zaklecia-i-czary"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold mb-1">✨ Zaklęcia i Czary</h3>
            <p className="text-sm text-muted-foreground">
              System magii i czarowania
            </p>
          </Link>
          <Link 
            href="/rulebook/cechy-i-umiejetnosci/cechy"
            className="p-4 border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold mb-1">📊 Cechy Postaci</h3>
            <p className="text-sm text-muted-foreground">
              Atrybuty i umiejętności
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}