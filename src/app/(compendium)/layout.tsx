import CompendiumNavbar from "@/application/compendium/CompendiumNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export const dynamic = 'force-dynamic';

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <CompendiumNavbar />
      <Separator />
      {children}
    </>
  );
};