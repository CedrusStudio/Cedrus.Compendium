import Navbar from "@/components/Navbar/Navbar";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};