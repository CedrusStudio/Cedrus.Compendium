import Navbar from "@/common/components/navbar/Navbar";
import { Separator } from "@/ui/separator";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <Navbar />
      <Separator />
      {children}
    </>
  );
};