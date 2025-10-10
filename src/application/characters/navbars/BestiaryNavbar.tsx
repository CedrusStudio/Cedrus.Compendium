"use client";

import { Input } from "@/ui/input"
import { useDebouncedCallback } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { actions } from "@/persistence/slices/bestiarySlice";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import Link from "next/link";
import React from "react";
import { LuPlus } from "react-icons/lu";
import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { battleIcon } from "@/domain/data/icons";

export default function BestiaryNavbar() 
{
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.bestiary.bestiaryNavbarSearch)
    const [searchTerm, setSearchTerm] = useState("");
    const pathname = usePathname();

    const debouncedSearch = useDebouncedCallback(value => 
    {
        const params = new URLSearchParams(searchParams);
        if (value) 
        {
            params.set('search', value);
        } 
        else 
        {
            replace(`/bestiary`);
            return;
        }

        replace(`/bestiary?${params.toString()}`);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    {
        const value = e.target.value;
        setSearchTerm(value);
        dispatch(actions.setBestiaryNavbarSearch(value));
        debouncedSearch(value);
    };

    useEffect(() =>
    {
        if (!searchQuery)
        {
            setSearchTerm("");
        }
    }, [searchQuery]);

    return (
        <nav className="grid grid-cols-9 items-center py-4">

            <NavbarBreadcrumb pathname={pathname} />

            <Input 
                name="search" 
                type="text" 
                placeholder="Wyszukaj bestię..."
                value={searchTerm}
                onChange={handleInputChange}
                className="w-1xl md:w-2xl lg:w-3xl col-span-6 justify-self-center"
            />

            <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
                <Button asChild variant="outline" size="icon">
                    <Link href="/bestiary/add"><LuPlus className="h-[1.2rem] w-[1.2rem]" /></Link>
                </Button>
                <Button asChild variant="outline" size="icon">
                    <Link href="/bestiary/battle">{battleIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                </Button>
                <NavbarDefaultButton />
            </div>

        </nav>
    );
}