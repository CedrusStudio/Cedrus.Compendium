"use client";

import Container from "@/components/global/Container";
import ThemeMode from "@/components/navbar/ThemeMode";
import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from 'use-debounce';
import { useRouter, useSearchParams, useParams, usePathname } from "next/navigation";
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

export default function Navbar() 
{
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.character.characterNavbarSearch)
    const [searchTerm, setSearchTerm] = useState("");

    const params = useParams<{ id?: string; characterId?: string }>(); 
    const pathname = usePathname();
    const idFromPath = params?.id ?? ""; 

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
            {/* <div className="flex flex-row justify-around items-center py-4"> */}
            {/* <div className="flex flex-row justify-between items-center py-4   mx-auto max-w-6xl xl:max-w-7xl"> */}

                <Breadcrumb className="col-span-2 pl-20">
                <BreadcrumbList>

                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">home</BreadcrumbLink>
                    </BreadcrumbItem>
                   
                   {
                        pathname.includes("/characters") && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/characters">characters</BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        ) 
                   }

                    {
                        idFromPath && pathname.includes(idFromPath) && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{idFromPath}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        ) 
                   }


                </BreadcrumbList>
                </Breadcrumb>

                <Input 
                    name="search" 
                    type="text" 
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="w-1xl md:w-2xl lg:w-3xl col-span-6 justify-self-center"
                />

                <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
                    <ThemeMode />
                    <Button asChild variant="outline" size="icon">
                        <Link href="/"><FaHome className="h-[1.2rem] w-[1.2rem]" /></Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}