import EditPerkView from "@/application/characters/edit/details/EditPerkView";
import { Perk } from "@/domain/characters/Perk";

export default function EditPerksList({ perks }: { perks: Perk[] })
{
  return (
    <ul className="list-inside grid grid-cols-2 gap-2">
    {
      perks.map((perk, index) => (
        <li key={index} className="text-md text-primary">
          <EditPerkView perk={perk} />
        </li>
      ))
    }
    </ul>
  );
}
