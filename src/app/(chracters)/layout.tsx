import CharacterNavbar from "@/application/characters/navbars/CharacterNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";
import { Suspense } from "react";
import LayoutFallback from "@/common/components/skeletons/LayoutFallback";

export default function layout({children}: PropsWithChildren)
{
  return (
    <Suspense fallback={<LayoutFallback />}>
      <CharacterNavbar />
      <Separator />
      {children}
    </Suspense>
  );
};