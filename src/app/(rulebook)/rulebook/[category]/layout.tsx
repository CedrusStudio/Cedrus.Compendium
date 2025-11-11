import { RulebookSidebar } from "@/application/rulebook/RulebookSidebar";
import { PropsWithChildren } from "react";
import { loadNavigation } from '@/persistence/rulebook/rulebookLoader';

export default function layout({children}: PropsWithChildren)
{
  const navigation = loadNavigation();
  return (
    <div className="flex">
      <RulebookSidebar navigation={navigation} />
      <div className="flex my-8 mx-10">
          {children}
      </div>
    </div>
  );
};