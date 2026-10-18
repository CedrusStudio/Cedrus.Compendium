export default function CompendiumView({ children, characterActions }: React.PropsWithChildren<{ characterActions?: React.ReactNode }>)
{
  if (characterActions) return (
    <div className="rounded-md border">
      <div className="flex flex-col p-2 text-center sm:flex-row sm:items-center sm:gap-2 sm:text-left">{children}</div>
      <div className="mx-2 border-t empty:hidden">{characterActions}</div>
    </div>
  );
  return (
    <div className="flex flex-col sm:flex-row sm:items-center border rounded-md p-2 sm:gap-2 text-center sm:text-left">
      {children}
    </div>
  );
};
