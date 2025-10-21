import AddCharacterView from "@/application/characters/add/AddCharacterView";
import { Suspense } from "react";
import LoadingSpinner from "@/common/components/LoadingSpinner";

export default async function AddPage()
{
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AddCharacterView />
    </Suspense>
  );
};