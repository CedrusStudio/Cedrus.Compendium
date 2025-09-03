import Image from "next/image";
import Logo from "@/components/Logo";
import LandingImg from "../assets/main.png";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() 
{
  return (
    <main>
      <header className="max-w-6xl mx-auto px-4 sm:px-8 py-6 grid gr">
        <section className="max-w-6xl mx-auto px-4 sm:px-8 h-screen grid lg:grid-cols-[1fr,400px] items-center">
          <Heading />
          <Description />
          <GetStartedButton />
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
      Character <span className="text-primary">sheet</span> app
    </h1>
  </div>
);

const Description = () =>
(
  <p className="leading-loose max-w-md mt-2">
    A simple and intuitive character sheet application for your tabletop RPG adventures. 
    Create, manage, and share your characters with ease.
  </p>
);

const GetStartedButton = () => 
(
  <Button asChild>
    <Link href="/characters">
      Get Started
    </Link>
  </Button>
);