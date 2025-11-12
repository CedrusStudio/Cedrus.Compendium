import Link from 'next/link';
import { Sword, Shield, Package, Shirt, PawPrint, ArrowLeft } from 'lucide-react';
import { Button } from '@/ui/button';

export default async function EquipmentPage()
{
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <HeroSection />
      <CategoryCards />
      <BackButton />
    </div>
  );
}

function BackButton()
{
  return (
    <div className="mb-6">
      <Link href="/compendium">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do Kompendium
        </Button>
      </Link>
    </div>
  );
}

function HeroSection() 
{
  return (
    <div className="text-center mb-12">
      <h1 className="text-5xl font-bold mb-4">Ekwipunek</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Przeglądaj broń, zbroje, tarcze i pozostały ekwipunek dostępny w grze.
      </p>
    </div>
  );
}

function CategoryCards()
{
  const categories = [
    {
      id: 'weapons',
      title: 'Broń',
      icon: <Sword className="h-8 w-8" />,
      description: 'Miecze, topory, łuki i pozostała broń',
      href: '/compendium/equipment/weapons',
      color: 'text-red-500'
    },
    {
      id: 'armors',
      title: 'Zbroje',
      icon: <Shirt className="h-8 w-8" />,
      description: 'Zbroje lekkie, średnie i ciężkie',
      href: '/compendium/equipment/armors',
      color: 'text-gray-500'
    },
    {
      id: 'shields',
      title: 'Tarcze',
      icon: <Shield className="h-8 w-8" />,
      description: 'Tarcze i osłony różnych rozmiarów',
      href: '/compendium/equipment/shields',
      color: 'text-blue-500'
    },
    {
      id: 'inventory',
      title: 'Przedmioty',
      icon: <Package className="h-8 w-8" />,
      description: 'Pierścienie, narzędzia i pozostałe przedmioty',
      href: '/compendium/equipment/inventory',
      color: 'text-amber-500'
    },
    {
      id: 'mounts',
      title: 'Wierzchowce',
      icon: <PawPrint className="h-8 w-8" />,
      description: 'Konie, zwierzęta juczne i wierzchowce',
      href: '/compendium/equipment/mounts',
      color: 'text-green-500'
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Kategorie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link 
            key={category.id}
            href={category.href}
            className="group p-6 border rounded-lg hover:bg-muted hover:shadow-lg transition-all duration-200"
          >
            <div className={`mb-4 ${category.color}`}>
              {category.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {category.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}