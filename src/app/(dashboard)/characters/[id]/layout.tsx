import Sidebar from "@/components/Sidebar/Sidebar";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <div className="py-16 px-4 sm:px-8 lg:px-16 grid lg:grid-cols-8">
        
        <div className="lg:block lg:col-span-1 lg:min-h-screen mr-2">
          <Sidebar />
        </div>

        <div className="lg:col-span-7">
          {children}
        </div>
      </div>
    </>
  );
};