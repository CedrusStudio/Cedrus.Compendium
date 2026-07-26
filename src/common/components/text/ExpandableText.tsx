"use client";

/**
 * Renders long descriptive text without blowing up the layout: clamps to a few
 * lines and reveals the rest behind a "Pokaż więcej / Pokaż mniej" toggle.
 * Short text renders as-is with no toggle.
 */

import { useState } from "react";

type ExpandableTextProps =
{
  text?: string;
  /** Classes applied to the paragraph (keep the caller's typography here). */
  className?: string;
  /** Tailwind line-clamp utility used while collapsed. */
  clampClassName?: string;
  /** Only show the toggle past this many characters. */
  threshold?: number;
  moreLabel?: string;
  lessLabel?: string;
  /** Alignment of the wrapper (and the "show more" toggle below the text). Defaults to "center". */
  align?: "center" | "start";
};

export default function ExpandableText({
  text,
  className,
  clampClassName = "line-clamp-6",
  threshold = 300,
  moreLabel = "Pokaż więcej",
  lessLabel = "Pokaż mniej",
  align = "center",
}: ExpandableTextProps)
{
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > threshold;

  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "items-center" : "items-start"}`}>
      <p className={`${className ?? ""} ${!expanded && isLong ? clampClassName : ""}`.trim()}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
};
