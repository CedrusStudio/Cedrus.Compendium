import { Perk } from "@/domain/characters/Perk";
import PerkView from "@/application/characters/details/PerkView";

export default function PerksList({ perks }: { perks: Perk[] })
{
  return (
    <ul className="list-inside grid grid-cols-2 gap-2">
    {
      perks.map((perk, index) => (
        <li key={index} className="text-md text-primary">
          <PerkView perk={perk} />
        </li>
      ))
    }
    </ul>
  );
}
