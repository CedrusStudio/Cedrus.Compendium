import RuleBookNavbar from "@/application/rulebook/RuleBookNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <RuleBookNavbar />
      <Separator />
      {children}
    </>
  );
};