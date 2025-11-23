
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
    <div className={cn("flex flex-col w-full p-2 rounded-md", className)}>
      
      <div className="flex flex-row flex-wrap gap-2 mb-0.5 place-items-center place-content-center sm:place-content-start">
        <p className="font-semibold">{entity.name} {entity.grade}</p>
        <TagsView tags={entity.tags} variant={tagsVariant} />
      </div>

      <p className="text-sm text-muted-foreground break-words">{entity.description}</p>
    </div>
  );
};