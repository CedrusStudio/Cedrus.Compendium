import BestiaryNavbar from "@/application/bestiary/BestiaryNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <BestiaryNavbar />
      <Separator />
      {children}
    </>
  );
};