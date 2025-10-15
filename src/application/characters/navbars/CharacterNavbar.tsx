"use client";

import { Input } from "@/ui/input"
import { useDebouncedCallback } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { actions } from "@/persistence/slices/characterSlice";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import Link from "next/link";
import React from "react";
import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { addIcon } from "@/presentation/icons";
import { namingConventions } from "@/presentation/namingConventions";

export default function CharacterNavbar() 
{
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.character.characterNavbarSearch)
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
            replace(`/characters`);
            return;
        }

        replace(`/characters?${params.toString()}`);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
    {
        const value = e.target.value;
        setSearchTerm(value);
        dispatch(actions.setCharacterNavbarSearch(value));
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
                placeholder={namingConventions.searchCharacter}
                value={searchTerm}
                onChange={handleInputChange}
                className="w-1xl md:w-2xl lg:w-3xl col-span-6 justify-self-center"
            />

            <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
                <Button asChild variant="outline" size="icon">
                    <Link href="/characters/add">{addIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                </Button>
                <NavbarDefaultButton />
            </div>

        </nav>
    );
}