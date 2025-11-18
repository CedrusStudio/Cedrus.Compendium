import { Table } from "@/ui/table";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import ExternalParticipantRow from "@/application/bestiary/battle/ExternalParticipantRow";
import { Table as TableType } from "@tanstack/react-table";
import { useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { useState } from "react";
import { TableBody } from "@/ui/table";

type BestiaryTableBodyProps<TData> = 
{
  table: TableType<TData>;
  columns: { accessorKey: string }[];
}

export default function BattleTableBody<TData>({ table, columns }: BestiaryTableBodyProps<TData>)
{
  const externalParticipants = useSelector((state: RootState) => state.bestiary.externalParticipants);
  const [externalSelection, setExternalSelection] = useState<Record<string, boolean>>({});

  const handleExternalSelectionChange = (id: string, selected: boolean) => 
  {
    setExternalSelection(prev => ({ ...prev, [id]: selected }));
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <DefaultTableHeader table={table} addBorders className="text-center" />
        <TableBody>
          
          {
            externalParticipants.map(participant => (
              <ExternalParticipantRow 
                key={participant.id}
                participant={participant}
                isSelected={!!externalSelection[participant.id]}
                onSelectionChange={(selected) => handleExternalSelectionChange(participant.id, selected)}
                columnCount={columns.length}
              />
            ))
          }

          {
            table.getRowModel().rows.map(row => <BestiaryTableRow key={row.id} row={row} /> )
          }
        </TableBody>
      </Table>
    </div>
  );
};