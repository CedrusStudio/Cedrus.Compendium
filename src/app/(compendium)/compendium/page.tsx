import Link from 'next/link';
import { Swords, Shield, Award, Activity, Package, Wand2, Users } from 'lucide-react';
import { GiSpellBook } from "react-icons/gi";

export default async function CompendiumPage()
{
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <HeroSection />
      <CategoryCards />
    </div>
  );
}

function HeroSection() 
{
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">Kompendium</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Przeglądaj i zarządzaj wszystkimi elementami gry: umiejętnościami, 
        zaklęciami, manewrami i ekwipunkiem.
      </p>
    </div>
  );
}

function CategoryCards()
{
  const categories = [
    {
      id: 'maneuvers',
      title: 'Manewry',
      icon: <Swords className="h-8 w-8" />,
      description: 'Techniki bojowe i manewry walki',
      href: '/compendium/maneuvers',
      color: 'text-red-500'
    },
    {
      id: 'stances',
      title: 'Postawy',
      icon: <Shield className="h-8 w-8" />,
      description: 'Style walki i postawy bojowe',
      href: '/compendium/stances',
      color: 'text-blue-500'
    },
    {
      id: 'states',
      title: 'Stany',
      icon: <Activity className="h-8 w-8" />,
      description: 'Efekty statusu i stany postaci',
      href: '/compendium/states',
      color: 'text-yellow-500'
    },
    {
      id: 'perks',
      title: 'Atuty',
      icon: <Award className="h-8 w-8" />,
      description: 'Specjalne umiejętności i zdolności postaci',
      href: '/compendium/perks',
      color: 'text-purple-500'
    },
    {
      id: 'powersSpecifications',
      title: 'Moce',
      icon: <GiSpellBook className="h-8 w-8" />,
      description: 'Specyfikacje mocy i ich właściwości',
      href: '/compendium/powers',
      color: 'text-indigo-500'
    },
    {
      id: 'spells',
      title: 'Zaklęcia',
      icon: <Wand2 className="h-8 w-8" />,
      description: 'Magia, czary i zaklęcia',
      href: '/compendium/spells',
      color: 'text-indigo-500'
    },
    {
      id: 'races',
      title: 'Rasy',
      icon: <Users className="h-8 w-8" />,
      description: 'Rasy postaci i ich cechy charakterystyczne',
      href: '/compendium/races',
      color: 'text-green-500'
    },
    {
      id: 'equipment',
      title: 'Ekwipunek',
      icon: <Package className="h-8 w-8" />,
      description: 'Broń, zbroje, tarcze i przedmioty',
      href: '/compendium/equipment',
      color: 'text-amber-500'
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
