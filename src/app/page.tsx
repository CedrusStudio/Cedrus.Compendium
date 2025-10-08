import Image from "next/image";
import LandingImg from "../assets/main.png";
import { Button } from "@/ui/button";
import Link from "next/link";
import { translate } from "@/domain/data/translations";

export default function HomePage() 
{
  return (
    <main>
      <header className="max-w-6xl mx-auto px-4 sm:px-8 py-1 grid gr">
        <section className="sm:px-8 h-screen grid lg:grid-cols-[1fr,400px] gap-3">
          <Heading />
          <Description />
          <CharactersLink />
          <BestiaryLink />
          <CompendiumLink />
          <RuleBookLink />
          <Image className="hidden lg:block rounded-4xl" src={LandingImg} alt="Landing" priority />
        </section>
      </header>
    </main>
  );
}

const Heading = () => 
(
  <div className="flex flex-row justify-around items-center">
    <h1 className="capitalize text-4xl md:text-7xl font-bold">
      Must have <span className="text-primary">Cedrus</span>
    </h1>
  </div>
);

const Description = () =>
(
  <p className="leading-loose max-w-md mt-2">
    Jest to aplikacja webowa stworzona z myślą o miłośnikach gier fabularnych, oferująca narzędzia do zarządzania postaciami, przeciwnikami i zasobami, ułatwiając prowadzenie i uczestnictwo w sesjach RPG.
  </p>
);

const CharactersLink = () => 
(
  <Button asChild>
    <Link href="/characters" className="capitalize">
      {translate("characters")}
    </Link>
  </Button>
);

const BestiaryLink = () => 
(
  <Button asChild>
    <Link href="/bestiary" className="capitalize">
      {translate("bestiary")}
    </Link>
  </Button>
);

const CompendiumLink = () => 
(
  <Button asChild>
    <Link href="/compendium" className="capitalize">
      {translate("compendium")}
    </Link>
  </Button>
);

const RuleBookLink = () => 
(
  <Button asChild>
    <Link href="/rulebook" className="capitalize">
      {translate("rulebook")}
    </Link>
  </Button>
);