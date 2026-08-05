import AddCharacterView from "@/application/characters/add/AddCharacterView";
import { getInitialCharacterCreationState } from '@/application/characters/add/characterCopyRoute';
import { Suspense } from "react";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { aiCharacterGenerationSettings } from "@/lib/env";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AddPage(props: { searchParams: SearchParams })
{
  const searchParams = await props.searchParams;
  const initialState = getInitialCharacterCreationState(searchParams);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* The provider decides whether generating calls a model or loads a draft
          prepared offline, and the button has to say which. Read here because
          the setting is server-only. */}
      <AddCharacterView {...initialState} aiProvider={aiCharacterGenerationSettings.provider} />
    </Suspense>
  );
};