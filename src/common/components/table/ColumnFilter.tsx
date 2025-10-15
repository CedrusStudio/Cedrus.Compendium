import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import { Table } from "@tanstack/react-table";
import { namingConventions } from "@/presentation/translations";
import { translate } from "@/presentation/translations";

export default function ColumnFilter<TData>({ table }: { table: Table<TData> })
{
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          {namingConventions.columns}
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
              {translate(column.id)}
            </DropdownMenuCheckboxItem>
          ))
      }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};