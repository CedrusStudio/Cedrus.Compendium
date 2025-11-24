import { Perk } from "@/domain/characters/Perk";
import { displayedText } from "@/presentation/translations";
import SummaryView from "@/application/common/SummaryView";

export default function PerksList({ perks }: { perks: Perk[] })
{
  return (
    <>
      {
        perks.length > 0 && (
          <h3 className="text-lg font-semibold text-center text-primary pb-4 capitalize">
          {displayedText.perks}
          </h3>
        )
      }

      <ul className="list-inside grid grid-cols-2 gap-2">
      {
        perks.map(perk => (
          <li key={perk.id} className="flex flex-row items-center  rounded-md p-2 bg-muted">
            <SummaryView entity={perk} tagsVariant="outline" />
          </li>
        ))
      }
      </ul>
    </>
  );
}
