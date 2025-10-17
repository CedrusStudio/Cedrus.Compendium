import { displayedText } from "@/presentation/translations";
import { Table as TableType } from "@tanstack/react-table";

type BestiaryTableFooterProps<TData> = 
{
  table: TableType<TData>;
}

export default function BestiaryTableFooter<TData>({ table }: BestiaryTableFooterProps<TData>)
{
  return (
    <div className="text-muted-foreground flex-1 text-sm mt-2">
        <span className="capitalize">{displayedText.selected}</span> {table.getFilteredSelectedRowModel().rows.length} {displayedText.from} {table.getFilteredRowModel().rows.length}.
    </div>
  );
};