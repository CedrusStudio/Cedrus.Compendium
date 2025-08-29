import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import StatisticsCard from "@/components/character/StatisticsCard";
import { Character } from "@/domain/Character";
import HealthDataCard from "@/components/character/HealthDataCard";
import DefenseDataCard from "@/components/character/DefenseDataCard";

export default function CharacterCarousel(input: { character: Character })
{
  const { character } = input;

  return (
    <Carousel className="w-full max-w-xl">

      <CarouselContent>
        <CarouselItem className="flex flex-col gap-2">
            <StatisticsCard title="Characteristics" statistics={Object.entries(character.characteristics)} />
            <StatisticsCard title="Attributes" statistics={Object.entries(character.attributes)} />
        </CarouselItem>

        <CarouselItem className="flex flex-col gap-2">
            <HealthDataCard health={character.health} constitution={character.characteristics.constitution} fortitude={character.attributes.fortitude} />
            <DefenseDataCard defense={character.defense} />
        </CarouselItem>

      </CarouselContent>
      
    </Carousel>
  );
};