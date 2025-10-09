import CharacterNavbar from "@/application/characters/navbars/CharacterNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <CharacterNavbar />
      <Separator />
      {children}
    </>
  );
};