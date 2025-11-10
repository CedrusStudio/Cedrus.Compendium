
import TagsView from "@/common/components/tags/TagsView";
import { badgeVariants } from "@/common/components/ui/badge";
import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type EntityHeadingProps =
{
  entity: { name: string; grade?: number | undefined; description: string; tags: string[] };
  className?: string;
  tagsVariant?: VariantProps<typeof badgeVariants>["variant"];
};

export default function SummaryView({ entity, className, tagsVariant = "secondary" }: EntityHeadingProps)
{
  return (
    <div className={cn("p-2 rounded-md w-full", className)}>
      <div className="flex flex-row gap-2">
        <h3 className="font-semibold text">{entity.name} {entity.grade}</h3>
        <TagsView tags={entity.tags} variant={tagsVariant} />
      </div>
        <p className="text-sm text-muted-foreground">{entity.description}</p>
    </div>
  );
};