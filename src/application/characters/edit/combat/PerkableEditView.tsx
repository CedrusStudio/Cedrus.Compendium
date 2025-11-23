export default function PerkableEditView({ children }: { children?: React.ReactNode })
{
  return (
    <div className="flex flex-col md:flex-row gap-2 m-1 items-center border rounded-md p-2 min-h-24">
      {children}
    </div>
  );
};