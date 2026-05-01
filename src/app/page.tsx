import Link from "next/link";
import { displayedText } from "@/common/translations";
import { Users, BookOpen, Scroll, Swords } from "lucide-react";
import { ApiKeySettings } from "@/common/components/ApiKeySettings";
import HomeQuickAccessSection from '@/application/personalization/HomeQuickAccessSection';

export default function HomePage() 
{
  return (
    <div className="container mx-auto px-6 py-6 max-w-7xl">
      <HeroSection />
      <CategoryCards />
      <HomeQuickAccessSection />
    </div>
  );
}

function HeroSection() 
{
  return (
    <div className="text-center mb-16">
      <div className="flex justify-end mb-4">
        <ApiKeySettings />
      </div>
      <h1 className="text-6xl lg:text-7xl font-bold mb-6">
        {displayedText.applicationHeading}
      </h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        {displayedText.applicationDescription}
      </p>
    </div>
  );
}

function CategoryCards()
{
  const categories = [
    {
      id: 'characters',
      title: displayedText.characters || 'Postacie',
      icon: <Users className="h-12 w-12" />,
      description: 'Twórz i zarządzaj swoimi postaciami gracza',
      href: '/characters',
      color: 'text-blue-500'
    },
    {
      id: 'bestiary',
      title: displayedText.bestiary || 'Bestiariusz',
      icon: <Swords className="h-12 w-12" />,
      description: 'Przeglądaj potwory i przeciwników',
      href: '/bestiary',
      color: 'text-red-500'
    },
    {
      id: 'compendium',
      title: displayedText.compendium || 'Kompendium',
      icon: <Scroll className="h-12 w-12" />,
      description: 'Umiejętności, zaklęcia, ekwipunek i manewry',
      href: '/compendium',
      color: 'text-purple-500'
    },
    {
      id: 'rulebook',
      title: displayedText.rulebook || 'Księga Zasad',
      icon: <BookOpen className="h-12 w-12" />,
      description: 'Kompletny podręcznik zasad systemu RPG',
      href: '/rulebook',
      color: 'text-amber-500'
    }
  ];

  return (
    <div className="mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link 
            key={category.id}
            href={category.href}
            className="group p-8 border rounded-lg hover:bg-muted hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center"
          >
            <div className={`mb-4 ${category.color}`}>
              {category.icon}
            </div>
            <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
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
