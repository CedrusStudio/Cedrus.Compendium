import { Skeleton } from "@/ui/skeleton";

export default function NavbarSkeleton()
{
  return (
    <nav className="flex flex-wrap items-center justify-around py-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-9 w-48" />
    </nav>
  );
};