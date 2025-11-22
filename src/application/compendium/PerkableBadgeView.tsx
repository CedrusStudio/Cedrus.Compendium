export default function PerkableBadgeView({ children }: React.PropsWithChildren)
{
  return (
    <div className="flex flex-row place-items-center place-content-center gap-2">
      {children}
    </div>
  );
};