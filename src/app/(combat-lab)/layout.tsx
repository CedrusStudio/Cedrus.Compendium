import CombatLabNavbar from "@/application/combat-lab/CombatLabNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

import LayoutFallback from "@/common/components/skeletons/LayoutFallback";
import RequestContent from "@/common/components/RequestContent";

export default function layout({children}: PropsWithChildren)
{
  return (
    <RequestContent fallback={<LayoutFallback />}>
      <CombatLabNavbar />
      <Separator />
      {children}
    </RequestContent>
  );
};
