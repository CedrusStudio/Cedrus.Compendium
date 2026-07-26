
import TagsView from "@/common/components/tags/TagsView";
import ExpandableText from "@/common/components/text/ExpandableText";
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

      <p className="font-semibold text-center sm:text-left">{entity.name} {entity.grade}</p>

      {/* ROADMAP 6.3 — the name above and the description below are
          `center → sm:left`; tags used to be hard-centred, so on desktop they
          floated out of the card's left edge. `responsive` keeps them in step. */}
      <div className="mb-0.5 mt-1">
        <TagsView tags={entity.tags} variant={tagsVariant} align="responsive" />
      </div>

      {/* ROADMAP 2.5 — used in compact grids (Atuty, Manewry, podgląd w bestiariuszu),
          so a long authored description shouldn't blow out every card's height. */}
      <ExpandableText
        text={entity.description}
        className="text-sm text-muted-foreground break-words"
        clampClassName="line-clamp-3"
        threshold={180}
        align="start"
      />
    </div>
  );
};