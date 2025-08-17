import { type PropsWithChildren } from "react";

export type SectionProps = PropsWithChildren & {
  title: string;
  className?: string;
};

export default function Section({ title, children, className }: SectionProps)
{
  return (
    <div className={className}>
        <h2>{title}</h2>
        {children}
    </div>
  );
};