import { PropsWithChildren } from "react";

type SheetTableProps =
{
  headers: readonly string[];
};

/**
 * Dense table used for every list on the sheet. Tables rather than cards is the
 * single biggest space win in the layout — a card costs ~60px of chrome per
 * entry, a row costs ~14px (see the print plan §5).
 */
export default function SheetTable({ headers, children }: PropsWithChildren<SheetTableProps>)
{
  return (
    <table className="sheet-table">
      <thead>
        <tr>
          {headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  );
};
