"use client";

import { useMemo, useState } from "react";
import { Perk } from "@/domain/characters/Perk";
import { displayedText } from "@/common/translations";
import SummaryView from "@/application/common/SummaryView";
import { Input } from "@/common/components/ui/input";

export default function PerksList({ perks }: { perks: Perk[] })
{
  const [query, setQuery] = useState('');

  // Client-side, instant filtering over the already-loaded perks — no refetch.
  const q = query.trim().toLowerCase();

  const filteredPerks = useMemo(() =>
  {
    if (!q) return perks;
    return perks.filter(perk =>
      perk.name.toLowerCase().includes(q)
      || (perk.description ?? '').toLowerCase().includes(q)
      || perk.tags.some(tag => String(tag).toLowerCase().includes(q)),
    );
  },
  [perks, q]);

  return (
    <>
      {
        perks.length > 0 && (
          <h3 className="text-lg font-semibold text-center text-primary pb-4 capitalize">
          {displayedText.perks}
          </h3>
        )
      }

      {
        perks.length > 0 && (
          <Input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={displayedText.searchByName}
            aria-label={displayedText.searchByName}
            className="w-full sm:max-w-xs mb-2"
          />
        )
      }

      <ul className="list-inside grid grid-cols-2 gap-2">
      {
        filteredPerks.map(perk => (
          <li key={perk.id} className="flex flex-row items-center  rounded-md p-2 bg-muted">
            <SummaryView entity={perk} tagsVariant="outline" />
          </li>
        ))
      }
      </ul>

      {
        perks.length > 0 && filteredPerks.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {displayedText.notFound}
          </p>
        )
      }
    </>
  );
}
