export default function CompendiumView({ children }: React.PropsWithChildren)
{
  return (
    <div className="flex flex-col sm:flex-row sm:items-center border rounded-md p-2 sm:gap-2 text-center sm:text-left">
      {children}
    </div>
  );
};