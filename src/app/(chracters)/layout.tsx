import CharacterNavbar from "@/application/characters/CharacterNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";
import LayoutFallback from "@/common/components/skeletons/LayoutFallback";
import RequestContent from "@/common/components/RequestContent";

export default function layout({children}: PropsWithChildren)
{
  return (
    <RequestContent fallback={<LayoutFallback />}>
      <CharacterNavbar />
      <Separator />
      {children}
    </RequestContent>
  );
};
