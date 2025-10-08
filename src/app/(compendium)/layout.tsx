import CompendiumNavbar from "@/common/components/navbars/CompendiumNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

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