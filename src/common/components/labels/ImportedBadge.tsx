import { Badge } from "@/common/components/ui/badge";

type ImportedBadgeProps = 
{
  isImported: boolean;
};

export default function ImportedBadge({ isImported }: ImportedBadgeProps) 
{
  if (!isImported) 
  {
    return null;
  }

  return (
    <Badge variant="full" className="ml-2">
      Imported
    </Badge>
  );
}
