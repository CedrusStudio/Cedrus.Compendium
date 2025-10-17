import { Perk } from "@/domain/characters/Perk";
import PerkView from "@/application/characters/details/PerkView";
import { displayedText } from "@/presentation/translations";

export default function PerksList({ perks }: { perks: Perk[] })
{
  return (
    <>
      <h3 className="text-lg font-semibold text-center text-primary pb-4 capitalize">
        {displayedText.perks}
      </h3>

      <ul className="list-inside grid grid-cols-2 gap-2">
      {
        perks.map((perk, index) => (
          <li key={index} className="text-md text-primary">
            <PerkView perk={perk} />
          </li>
        ))
      }
      </ul>
    </>
  );
}
