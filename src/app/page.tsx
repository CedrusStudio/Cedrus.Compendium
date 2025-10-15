import Image from "next/image";
import LandingImg from "../assets/main.png";
import { Button } from "@/ui/button";
import Link from "next/link";
import { translate } from "@/presentation/translations";
import { displayedText } from "@/presentation/translations";

export default function HomePage() 
{
  return (
    <main>
      <header className="max-w-6xl mx-auto px-4 sm:px-8 py-1 grid gr">
        <section className="sm:px-8 h-screen grid lg:grid-cols-[1fr,400px] gap-3">
          <Heading />
          <Description />
          <StartButtonLink name="characters" />
          <StartButtonLink name="bestiary" />
          <StartButtonLink name="compendium" />
          <StartButtonLink name="rulebook" />
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
      {displayedText.applicationHeading}
    </h1>
  </div>
);

const Description = () =>
(
  <p className="leading-loose max-w-md mt-2">
    {displayedText.applicationDescription}
  </p>
);

const StartButtonLink = ({ name }: { name: string }) => 
(
  <Button asChild>
    <Link href={`/${name}`} className="capitalize">
      {translate(name)}
    </Link>
  </Button>
);