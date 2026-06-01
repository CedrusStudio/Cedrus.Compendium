import AddCharacterView from "@/application/characters/add/AddCharacterView";
import { getInitialCharacterCreationState } from '@/application/characters/add/characterCopyRoute';
import { Suspense } from "react";
import LoadingSpinner from "@/common/components/LoadingSpinner";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AddPage(props: { searchParams: SearchParams })
{
  const searchParams = await props.searchParams;
  const initialState = getInitialCharacterCreationState(searchParams);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AddCharacterView {...initialState} />
    </Suspense>
  );
};