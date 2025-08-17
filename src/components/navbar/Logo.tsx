import Link from "next/link";
import { Button } from "../ui/button"
import CedrusLogo from "@/assets/logo.png"
import Image from "next/image";

export default function Logo() 
{
  return (
      <Button size="icon" asChild>
        <Link href="/">
          <Image src={CedrusLogo} alt="Cedrus Logo"/>
        </Link>
      </Button>
  );
}