import AddCharacterView from "@/application/characters/add/AddCharacterView";
import { getInitialCharacterCreationState } from '@/application/characters/add/characterCopyRoute';
import { Suspense } from "react";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import { aiCharacterGenerationSettings } from "@/lib/env";

type AddCharacterPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function AddPage(props: AddCharacterPageProps)
{
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AddCharacterContent {...props} />
    </Suspense>
  );
}

async function AddCharacterContent(props: AddCharacterPageProps)
{
  const searchParams = await props.searchParams;
  const initialState = getInitialCharacterCreationState(searchParams);

  // The button label follows the server-only AI provider setting.
  return <AddCharacterView {...initialState} aiProvider={aiCharacterGenerationSettings.provider} />;
};