import CharacterNavbar from "@/application/characters/navbars/CharacterNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";
import { Suspense } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CharacterNavbar />
      <Separator />
      {children}
    </Suspense>
  );
};