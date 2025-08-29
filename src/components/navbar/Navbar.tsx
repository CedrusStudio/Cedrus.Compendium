"use client";

import Container from "@/components/global/Container";
import ThemeMode from "@/components/navbar/ThemeMode";
import { Input } from "@/components/ui/input"
import { useDebouncedCallback } from 'use-debounce';
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/store";
import { actions } from "@/persistence/characterSlice";
import { useEffect, useState } from "react";

export default function Navbar() 
{
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const dispatch = useDispatch()
    const searchQuery = useSelector((state: RootState) => state.character.characterNavbarSearch)
    const [searchTerm, setSearchTerm] = useState("");

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
            <Container className="flex flex-row justify-between items-center py-4">
                <Input 
                    name="search" 
                    type="text" 
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="w-1xl md:w-2xl lg:w-3xl"
                />
                <ThemeMode />
            </Container>
        </nav>
    );
}