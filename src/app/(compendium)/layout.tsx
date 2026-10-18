import CompendiumNavbar from "@/application/compendium/CompendiumNavbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";
import { CompendiumCharacterScopeProvider } from '@/application/compendium/character-scope/CompendiumCharacterScopeProvider';

export const dynamic = 'force-dynamic';

export default function layout({children}: PropsWithChildren)
{
  return (
    <CompendiumCharacterScopeProvider>
      <CompendiumNavbar />
      <Separator />
      {children}
    </CompendiumCharacterScopeProvider>
  );
};
