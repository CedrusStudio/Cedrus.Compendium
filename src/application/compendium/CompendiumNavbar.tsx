"use client";

import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { usePathname } from "next/navigation";
import { ApiKeySettings } from "@/common/components/ApiKeySettings";

export default function CompendiumNavbar()
{
const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between py-4 pr-11">
        <NavbarBreadcrumb pathname={pathname} />
        <div className="flex gap-2 items-center">
          <ApiKeySettings />
          <NavbarDefaultButton />
        </div>
    </nav>
  );
};