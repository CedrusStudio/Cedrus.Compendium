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
import { displayedText } from "@/presentation/translations";

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
        if (value) params.set('search', value);
        else params.delete('search');
        replace(`/characters?${params}`);
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
        <nav className="flex items-center justify-between py-4 px-10 gap-3">

            <div className="hidden lg:block">
                <NavbarBreadcrumb pathname={pathname} />
            </div>

            <Input 
                name="search" 
                type="text" 
                placeholder={displayedText.searchCharacter}
                value={searchTerm}
                onChange={handleInputChange}
                className="w-xl lg:w-1xl lg:w-2xl"
            />

            <div className="flex flex-row items-center gap-2 justify-self-center">
                <Button asChild variant="outline" size="icon">
                    <Link href="/characters/add">{addIcon("h-[1.2rem] w-[1.2rem]")}</Link>
                </Button>
                <NavbarDefaultButton />
            </div>

        </nav>
    );
}