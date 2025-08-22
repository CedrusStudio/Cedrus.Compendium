import Navbar from "@/components/navbar/Navbar";
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