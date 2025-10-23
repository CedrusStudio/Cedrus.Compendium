import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import { Table } from "@tanstack/react-table";
import { displayedText } from "@/presentation/translations";

export default function ColumnFilter<TData>({ table }: { table: Table<TData> })
{
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="hidden sm:block">
        <Button variant="outline" className="ml-auto capitalize">
          {displayedText.columns}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
      {
        table
          .getAllColumns()
          .filter(column => column.getCanHide())
          .map(column => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={value => column.toggleVisibility(!!value)}
            >
              {displayedText[column.id as keyof typeof displayedText]}
            </DropdownMenuCheckboxItem>
          ))
      }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};