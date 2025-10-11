"use client";

import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { usePathname } from "next/navigation";

export default function RuleBookNavbar()
{
const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between py-4 pr-11">
        <NavbarBreadcrumb pathname={pathname} />
        <NavbarDefaultButton />
    </nav>
  );
};