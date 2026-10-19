"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/ui/button";
import Link from "next/link";
import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { battleIcon, bestiaryIcon } from "@/common/icons";

export default function BestiaryNavbar() 
{
    const pathname = usePathname();

    const displayBattleNavigation = !pathname.includes("/battle");

    return (
        <nav className="flex items-center justify-end md:justify-between py-4 px-3 sm:px-10">

            <div className="hidden md:block">
                <NavbarBreadcrumb pathname={pathname} />
            </div>

            <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
                {
                    displayBattleNavigation ? (
                        <Button asChild variant="outline" size="icon">
                            <Link href="/bestiary/battle">{battleIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline" size="icon">
                            <Link href="/bestiary">{bestiaryIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                        </Button>
                    )
                }
                <NavbarDefaultButton />
            </div>

        </nav>
    );
}