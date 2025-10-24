"use client";

import { useSearchManeuvers } from "@/application/compendium/hooks/useSearchManeuvers";
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";

export default function ManeuversList()
{
  const { maneuvers } = useSearchManeuvers();

  return (
    <>
      <div className="flex flex-row gap-8 m-3 px-10">
        <h3 className="text-lg font-semibold">Pinned Search Box</h3>
        {/* infinite scroll */}
        <h3 className="text-lg font-semibold">Pinned Sort Box</h3>
      </div>

      <div className="flex flex-col gap-2">
      {
        maneuvers.map(maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} />)
      }
      </div>
    </>
  );
};