"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable,
  type AccessorKeyColumnDef, type ColumnFiltersState, type Row, type SortingState,
} from "@tanstack/react-table";
import { allowedTalentCategories, type Talent } from "@/domain/characters/Talent";
import { defaultColumnKeys } from "./defaultColumns";
import { displayedText } from "@/common/translations";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import SelectFilter from "@/common/components/table/SelectFilter";
import EmptyTable from "@/common/components/EmptyTable";
import { Table, TableBody } from "@/ui/table";

const batchSize = 10;

interface CharacterTalentTableProps {
  columns: AccessorKeyColumnDef<Talent>[];
  data: Talent[];
  renderRow: (row: Row<Talent>) => ReactNode;
  renderActions?: (showAddedTalent: (name: string) => void) => ReactNode;
  columnClassName?: (id: string) => string | undefined;
}

export default function CharacterTalentTable({
  columns, data, renderRow, renderActions, columnClassName,
}: CharacterTalentTableProps) {
  "use no memo";
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // TanStack's mutable table API requires the compiler opt-out above.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data, columns,
    getRowId: talent => talent.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      columnVisibility: Object.fromEntries(columns.map(column => [column.id ?? column.accessorKey, !column.meta?.initiallyHidden])),
    },
    state: { columnFilters, sorting },
    onColumnFiltersChange: update => {
      setColumnFilters(update);
      setVisibleCount(batchSize);
    },
    onSortingChange: update => {
      setSorting(update);
      setVisibleCount(batchSize);
    },
  });

  const rows = table.getRowModel().rows;
  const hasMore = visibleCount < rows.length;
  const category = table.getColumn(defaultColumnKeys.category);

  const observeEnd = useCallback((target: HTMLDivElement | null) => {
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisibleCount(Infinity);
      return;
    }
    let active = true;
    const observer = new IntersectionObserver(entries => {
      if (active && entries.some(entry => entry.isIntersecting)) {
        setVisibleCount(visibleCount + batchSize);
      }
    });
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [visibleCount]);

  const showAddedTalent = (name: string) => {
    table.setColumnFilters([{ id: defaultColumnKeys.name, value: name }]);
  };

  return (
    <div className="min-w-0 space-y-2">
      <div role="group" aria-label="Narzędzia talentów" className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="min-w-0 max-w-sm flex-[1_1_9rem]">
          <NameInputSearch table={table} defaultColumnKeys={defaultColumnKeys} />
        </div>
        <SelectFilter
          selectedOption={(category?.getFilterValue() as string) || "all"}
          handleOnSelectedValueChange={value => category?.setFilterValue(value === "all" ? undefined : value)}
          columnKey={defaultColumnKeys.category}
          options={allowedTalentCategories}
          allOption={displayedText.all}
        />
        {renderActions?.(showAddedTalent)}
        <div className="ml-auto">
          <ColumnFilter table={table} />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table className={columnClassName ? "table-fixed sm:table-auto" : undefined}>
          <DefaultTableHeader table={table} columnClassName={columnClassName} />
          <TableBody>
            {rows.length === 0
              ? <EmptyTable colSpan={columns.length} />
              : rows.slice(0, visibleCount).map(renderRow)}
          </TableBody>
        </Table>
      </div>
      {hasMore && <div ref={observeEnd} aria-hidden="true" className="h-px" />}
    </div>
  );
}
