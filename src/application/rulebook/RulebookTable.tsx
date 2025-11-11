import type { RulebookTable as RulebookTableType } from '@/domain/rulebook/RulebookTypes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { parseInlineMarkdown } from './utils/markdownParser';

type RulebookTableProps = 
{
  table: RulebookTableType;
};

export function RulebookTable({ table }: RulebookTableProps) 
{
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>

        <TableHeader>
          <TableRow>
          { table.headers.map((header, idx) => <TableHead key={idx} className="font-semibold">{parseInlineMarkdown(header)}</TableHead>) }
          </TableRow>
        </TableHeader>

        <TableBody>
        {
          table.rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
            { row.map((cell, cellIdx) => <TableCell key={cellIdx}>{parseInlineMarkdown(cell)}</TableCell>) }
            </TableRow>
          ))
        }
        </TableBody>

      </Table>

      { table.caption && <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/50">{parseInlineMarkdown(table.caption)}</div> }
    </div>
  );
}
