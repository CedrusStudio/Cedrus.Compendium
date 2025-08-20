import Link from "next/link";
import { Button } from "@/components/ui/button"
import CedrusLogo from "@/assets/logo.png"
import Image from "next/image";

export default function Logo({ className }: { className?: string }) 
{
  return (
      <Button size="icon" asChild>
        <Link href="/">
          <Image src={CedrusLogo} alt="Cedrus Logo" className={`rounded-1xl ${className}`} priority/>
        </Link>
      </Button>
  );
}