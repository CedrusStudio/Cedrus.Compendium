import BestiaryNavbar from "@/application/bestiary/BestiaryNavbar";
import { Separator } from "@/ui/separator";
import { Suspense, type PropsWithChildren } from "react";

import LayoutFallback from "@/common/components/skeletons/LayoutFallback";

export default function layout({children}: PropsWithChildren)
{
  return (
    <Suspense fallback={<LayoutFallback />}>
      <BestiaryNavbar />
      <Separator />
      {children}
    </Suspense>
  );
};
