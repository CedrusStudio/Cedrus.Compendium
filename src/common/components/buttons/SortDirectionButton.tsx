import { Button } from "@/common/components/ui/button";
import { arrowDownIcon, arrowUpIcon } from "@/presentation/icons";

type SortDirectionButtonProps =
{
    sortDirection: string;
    setSortDirection: (direction: string) => void;
    sortDirectionQueryParamChange: (paramValue: string) => void;
}

export default function SortDirectionButton({ sortDirection, setSortDirection, sortDirectionQueryParamChange }: SortDirectionButtonProps)
{
  return (
    <Button
        variant="outline"
        size='icon'
        onClick={() => {
            const newDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(newDirection);
            sortDirectionQueryParamChange(newDirection);
        }}
    >
        { sortDirection === "desc" ? arrowDownIcon : arrowUpIcon }
    </Button>
  );
};