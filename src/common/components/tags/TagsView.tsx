"use client";
import { Badge, badgeVariants } from "@/ui/badge";
import { VariantProps } from "class-variance-authority";

type TagsViewProps =
{
    tags: string[];
    variant?: VariantProps<typeof badgeVariants>["variant"];
};

export default function TagsView({ tags, variant = "secondary" }: TagsViewProps)
{
  return (
    <>
    {
      tags.length > 0 && (
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2">
        {
          tags.map((tag) => <Badge key={tag} variant={variant}>{tag}</Badge>)
        }
        </div>
      )
    }
    </>
  );
};