import RuleBookNavbar from "@/common/components/navbars/RuleBookNavbar";
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