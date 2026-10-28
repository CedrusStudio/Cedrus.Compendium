import { PropsWithChildren, ReactNode } from "react";

type SheetTableProps =
{
  headers: readonly ReactNode[];
  groups?: readonly { label: string; columns: number }[];
  className?: string;
};

/**
 * Dense table used for every list on the sheet. Tables rather than cards is the
 * single biggest space win in the layout — a card costs ~60px of chrome per
 * entry, a row costs ~14px (see the print plan §5).
 */
export default function SheetTable({ headers, groups, className, children }: PropsWithChildren<SheetTableProps>)
{
  return (
    <table className={className ? `sheet-table ${className}` : "sheet-table"}>
      {groups?.map((group, index) => <colgroup key={index} span={group.columns} />)}
      <thead>
        {groups && <tr className="sheet-table-groups">{groups.map((group, index) => (
          <th key={index} colSpan={group.columns} scope="colgroup">{group.label}</th>
        ))}</tr>}
        <tr>
          {headers.map((header, index) => <th key={index} scope="col">{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  );
};
