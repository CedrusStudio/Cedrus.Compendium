import { Spinner } from "@/ui/spinner";

export default function LoadingSpinner()
{
  return (
    <div className="flex justify-center items-center">
      <Spinner className="size-13 mt-10" />
    </div>
  );
};