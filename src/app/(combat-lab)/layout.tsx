import CombatLabNavbar from "@/application/combat-lab/CombatLabNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export const dynamic = 'force-dynamic';

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <CombatLabNavbar />
      <Separator />
      {children}
    </>
  );
};
