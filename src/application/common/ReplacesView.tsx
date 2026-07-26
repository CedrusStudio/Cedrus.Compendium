"use client";

/**
 * Shows what an entity REPLACES (ROADMAP 8.6).
 *
 * The library authored this as a requirement text ("Zastępuje Młyniec"), which
 * it never was — it says nothing about the character, only that this entity
 * supersedes another. Rendered separately from requirements so the distinction
 * stays visible, and deliberately neutral: replacing something is information,
 * not a condition anyone can fail.
 */

type ReplacesViewProps =
{
  entity: { replaces?: string[] | null };
};

export default function ReplacesView({ entity }: ReplacesViewProps)
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
        <span key={name} className="rounded-full border px-2 py-0.5 text-foreground">{name}</span>
      ))}
    </div>
  );
};
