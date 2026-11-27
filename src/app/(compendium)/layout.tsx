import CompendiumNavbar from "@/application/compendium/CompendiumNavbar";
import { Separator } from "@/ui/separator";
import { Suspense, type PropsWithChildren } from "react";
import { CompendiumCharacterScopeProvider } from '@/application/compendium/character-scope/CompendiumCharacterScopeProvider';

import LayoutFallback from "@/common/components/skeletons/LayoutFallback";

export default function layout({children}: PropsWithChildren)
{
  return (
    <Suspense fallback={<LayoutFallback />}>
      <CompendiumCharacterScopeProvider>
        <CompendiumNavbar />
        <Separator />
        {children}
      </CompendiumCharacterScopeProvider>
    </Suspense>
  );
};
