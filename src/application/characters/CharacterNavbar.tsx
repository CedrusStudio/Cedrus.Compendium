"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/ui/button";
import Link from "next/link";
import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { addIcon } from "@/common/icons";
import { ApiKeySettings } from "@/common/components/ApiKeySettings";

export default function CharacterNavbar() 
{
    const pathname = usePathname();

    return (
        <nav className="flex items-center justify-between py-4 px-10 gap-3">

            <div className="hidden md:block">
                <NavbarBreadcrumb pathname={pathname} />
            </div>

            <div className="flex-1" />

            <div className="flex flex-row items-center gap-2 justify-self-center">
                <ApiKeySettings />
                <Button asChild variant="outline" size="icon">
                    <Link href="/characters/add">{addIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                </Button>
                <NavbarDefaultButton />
            </div>

        </nav>
    );
}