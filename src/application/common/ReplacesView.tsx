"use client";

/**
 * Shows what an entity REPLACES (ROADMAP 8.6).
 *
 * The library authored this as a requirement text ("Zastępuje Młyniec"), which
 * it never was — it says nothing about the character, only that this entity
 * supersedes another. Rendered separately from requirements so the distinction
 * stays visible, and deliberately neutral: replacing something is information,
 * not a condition anyone can fail.
 *
 * Each name links to the replaced entity (8.9). There are no per-entity pages in
 * the Kompendium, so the link is a search deep-link into the group's list — the
 * same pattern `DetailsView` uses for a character's race. Case does not matter:
 * `SearchQueryBuilder` emits `{ contains, mode: "insensitive" }`, which is why
 * the lowercase names left by the 8.6 migration still resolve.
 */

import Link from "next/link";
import type { RequirementEntityType } from "@/common/hooks/useEntityRequirements";

type ReplacesViewProps =
{
  entity: { replaces?: string[] | null };
  /** Compendium group the replaced entities belong to — always the owner's own kind. */
  group: RequirementEntityType;
};

export default function ReplacesView({ entity, group }: ReplacesViewProps)
{
  const replaces = entity.replaces ?? [];

  if (replaces.length === 0)
  {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground">
      <span>Zastępuje:</span>
      {replaces.map((name) => (
        <Link
          key={name}
          href={`/compendium/${group}?search=${encodeURIComponent(name)}`}
          className="rounded-full border px-2 py-0.5 text-foreground hover:bg-accent"
        >
          {name}
        </Link>
      ))}
    </div>
  );
};
