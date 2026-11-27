import { connection } from "next/server";
import { Suspense, type PropsWithChildren, type ReactNode } from "react";

async function AfterRequest({ children }: PropsWithChildren)
{
  await connection();
  return children;
}

export default function RequestContent({ children, fallback }: PropsWithChildren<{ fallback: ReactNode }>)
{
  return <Suspense fallback={fallback}><AfterRequest>{children}</AfterRequest></Suspense>;
}
