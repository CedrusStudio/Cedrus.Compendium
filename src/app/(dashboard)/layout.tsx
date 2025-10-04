import Navbar from "@/components/global/navbar/Navbar";
import { Separator } from "@/components/ui/separator";
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