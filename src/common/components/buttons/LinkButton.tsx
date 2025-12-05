import { Button } from "@/ui/button";
import Link from "next/link";
import { displayedText } from "@/common/translations";

type LinkButtonProps =
{
  name: keyof typeof displayedText;
  basePath?: string;
}

export default function LinkButton({ name, basePath }: LinkButtonProps)
{
  return (
  <Button asChild>
    <Link href={`${basePath || ''}/${name}`} className="capitalize">
      {displayedText[name]}
    </Link>
  </Button>
  );
};