import CompendiumNavbar from "@/application/compendium/CompendiumNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";
import { CompendiumCharacterScopeProvider } from '@/application/compendium/character-scope/CompendiumCharacterScopeProvider';

import LayoutFallback from "@/common/components/skeletons/LayoutFallback";
import RequestContent from "@/common/components/RequestContent";

export default function layout({children}: PropsWithChildren)
{
  return (
    <RequestContent fallback={<LayoutFallback />}>
      <CompendiumCharacterScopeProvider>
        <CompendiumNavbar />
        <Separator />
        {children}
      </CompendiumCharacterScopeProvider>
    </RequestContent>
  );
};
