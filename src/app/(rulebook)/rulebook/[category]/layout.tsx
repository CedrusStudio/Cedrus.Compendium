import { RulebookSidebar } from "@/application/rulebook/RulebookSidebar";
import { PropsWithChildren } from "react";
import { loadNavigation } from '@/persistence/rulebook/rulebookLoader';

export default function layout({children}: PropsWithChildren)
{
  const navigation = loadNavigation();
  return (
    <div className="flex min-w-0 flex-col xl:flex-row">
      <RulebookSidebar navigation={navigation} />
      <div className="min-w-0 flex-1 my-6 mx-3 sm:mx-6 lg:mx-10">
          {children}
      </div>
    </div>
  );
};
