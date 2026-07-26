"use client";
import { Badge, badgeVariants } from "@/ui/badge";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * `center` keeps the historical behaviour (used by compact grids, bestiary
 * columns and the character sheet, where tags sit on their own centred row).
 * `responsive` follows the card it lives in — centred on mobile, left-aligned
 * from `sm` up — which is what the compendium needs so tags line up with the
 * name and description instead of floating in the middle of the card (Wave 6.3).
 */
export type TagsAlign = "center" | "start" | "responsive";

const ALIGN_CLASS: Record<TagsAlign, string> = {
  center: "justify-center",
  start: "justify-start",
  responsive: "justify-center sm:justify-start",
};

type TagsViewProps =
{
    tags: string[];
    variant?: VariantProps<typeof badgeVariants>["variant"];
    className?: string;
    align?: TagsAlign;
};

export default function TagsView({ tags, variant = "secondary", className, align = "center" }: TagsViewProps)
{
  return (
    <>
    {
      tags && tags.length > 0 && (
        <div className={cn("flex flex-row flex-wrap items-center gap-x-2 gap-y-1.5", ALIGN_CLASS[align], className)}>
        {
          tags.map((tag) => <Badge key={tag} variant={variant}>{tag}</Badge>)
        }
        </div>
      )
    }
    </>
  );
};
