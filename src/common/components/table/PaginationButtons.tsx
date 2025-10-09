import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/ui/button";
import { Table } from "@tanstack/react-table";

export default function PaginationButtons<TData>({ table }: { table: Table<TData> })
{
  return (
    <div className="flex items-center justify-end space-x-2 py-4 ml-auto">
        <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
        >
        <ArrowLeft />
        </Button>

        <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
        >
        <ArrowRight />
        </Button>
    </div>
  );
};