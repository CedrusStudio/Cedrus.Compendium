import { Separator } from "@/ui/separator";
import LoadingSpinner from "@/common/components/LoadingSpinner";
import NavbarSkeleton from "@/common/components/skeletons/NavbarSkeleton";

export default function LayoutFallback()
{
  return (
    <div>
      <NavbarSkeleton />
      <Separator />
      <div className="flex item-center justify-center my-10">
        <LoadingSpinner />
      </div>
    </div>
  );
}