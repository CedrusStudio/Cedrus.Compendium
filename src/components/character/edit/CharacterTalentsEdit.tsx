import { columns } from "@/app/(dashboard)/characters/[id]/columns"
import { DataTable } from "@/app/(dashboard)/characters/[id]/data-table"
import { Talent } from "@/domain/Character";

type CharacterTalentsEditProps =
{
    data: Talent[]
}

export default function CharacterTalentsEdit({ data }: CharacterTalentsEditProps)
{
  return (
    <DataTable columns={columns} data={data} />
  );
};