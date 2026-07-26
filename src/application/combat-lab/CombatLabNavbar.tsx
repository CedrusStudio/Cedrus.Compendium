"use client";

import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { usePathname } from "next/navigation";
import { ApiKeySettings } from "@/common/components/ApiKeySettings";

export default function CombatLabNavbar()
{
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between py-4 px-10 gap-3">

      <div className="hidden md:block">
        <NavbarBreadcrumb pathname={pathname} />
      </div>

      <div className="flex-1" />

      <div className="flex gap-2 items-center">
        <ApiKeySettings />
        <NavbarDefaultButton />
      </div>

    </nav>
  );
};
