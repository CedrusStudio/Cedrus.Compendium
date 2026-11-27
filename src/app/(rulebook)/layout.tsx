import RuleBookNavbar from "@/application/rulebook/RuleBookNavbar";
import { Separator } from "@/ui/separator";
import { Suspense, type PropsWithChildren } from "react";
import LayoutFallback from "@/common/components/skeletons/LayoutFallback";

export default function layout({children}: PropsWithChildren)
{
  return (
    <Suspense fallback={<LayoutFallback />}>
      <RuleBookNavbar />
      <Separator />
      {children}
    </Suspense>
  );
};
