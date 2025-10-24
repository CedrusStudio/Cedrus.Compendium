import Image from "next/image";
import LandingImg from "../assets/main.png";
import { displayedText } from "@/presentation/translations";
import LinkButton from "@/common/components/buttons/LinkButton";

export default function HomePage() 
{
  return (
    <main>
      <header className="max-w-6xl mx-auto px-4 sm:px-8 py-1 grid gr">
        <section className="sm:px-8 h-screen flex flex-col gap-3">
          <Heading />
          <Description />
          <LinkButton name="characters" />
          <LinkButton name="bestiary" />
          <LinkButton name="compendium" />
          <LinkButton name="rulebook" />
          <Image className="hidden lg:block rounded-4xl" src={LandingImg} alt="Landing" priority />
        </section>
      </header>
    </main>
  );
}

const Heading = () =>
(
  <div className="flex flex-row justify-around items-center">
    <h1 className="capitalize text-4xl lg:text-7xl font-bold">
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