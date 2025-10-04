"use client";

import ThemeMode from "@/components/navbar/ThemeMode";
import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/store";
import { actions } from "@/persistence/characterSlice";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaHome } from "react-icons/fa";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react";
import { LuPlus } from "react-icons/lu";
import { translate } from "@/domain/translations";

export default function Navbar() 
{
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.character.characterNavbarSearch)
    const [searchTerm, setSearchTerm] = useState("");

    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

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
        <nav>
            <div className="grid grid-cols-9 items-center py-4">

                <Breadcrumb className="col-span-2 pl-20">
                    <BreadcrumbList>

                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">start</BreadcrumbLink>
                        </BreadcrumbItem>
                    
                        {
                            segments.map((segment, index) => 
                            {
                                const href = "/" + segments.slice(0, index + 1).join("/");
                                const isLast = index === segments.length - 1;
                                
                                return (
                                    <React.Fragment key={index}>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                        {
                                            isLast 
                                                ? <BreadcrumbPage>{translate(segment)}</BreadcrumbPage> 
                                                : <BreadcrumbLink href={href}>{translate(segment)}</BreadcrumbLink>
                                        }
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                );
                            })
                        }


                    </BreadcrumbList>
                </Breadcrumb>

                <Input 
                    name="search" 
                    type="text" 
                    placeholder="Wyszukaj postać..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="w-1xl md:w-2xl lg:w-3xl col-span-6 justify-self-center"
                />

                <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/characters/add"><LuPlus className="h-[1.2rem] w-[1.2rem]" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="icon">
                        <Link href="/"><FaHome className="h-[1.2rem] w-[1.2rem]" /></Link>
                    </Button>
                    <ThemeMode />
                </div>
            </div>
        </nav>
    );
}