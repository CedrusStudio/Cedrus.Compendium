/**
 * Component for rendering tables from rulebook content
 */

import type { RulebookTable as RulebookTableType } from '@/domain/rulebook/RulebookTypes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';

type RulebookTableProps = {
  table: RulebookTableType;
};

export function RulebookTable({ table }: RulebookTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {table.headers.map((header, idx) => (
              <TableHead key={idx} className="font-semibold">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <TableCell key={cellIdx}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {table.caption && (
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/50">
          {table.caption}
        </div>
      )}
    </div>
  );
}
