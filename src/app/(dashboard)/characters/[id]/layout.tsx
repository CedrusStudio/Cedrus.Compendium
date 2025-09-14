import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <div className="py-6 px-4">
        {children}
      </div>
    </>
  );
};