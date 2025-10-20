import AddCharacterView from "@/application/characters/add/AddCharacterView";
import { Suspense } from "react";

export default async function AddPage()
{
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddCharacterView />
    </Suspense>
  );
};