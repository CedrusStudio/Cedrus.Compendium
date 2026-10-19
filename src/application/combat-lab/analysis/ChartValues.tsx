import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';

/** Values remain available without hovering over a chart, including on touch. */
export function ChartValues({ data }: { data: readonly { label: string; count: number }[] }) {
  return (
    <details className="mt-3 min-w-0 rounded border p-2 text-sm">
      <summary className="cursor-pointer py-2">Dane wykresu</summary>
      <Table>
        <TableHeader><TableRow><TableHead>Wartość</TableHead><TableHead>Liczba</TableHead></TableRow></TableHeader>
        <TableBody>{data.map((row, index) => <TableRow key={`${row.label}-${index}`}><TableCell>{row.label}</TableCell><TableCell>{row.count}</TableCell></TableRow>)}</TableBody>
      </Table>
    </details>
  );
}
