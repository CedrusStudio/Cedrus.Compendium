"use server";

import { Character } from "@/domain/Character";
import fs from 'fs';
import { UpsertCharacterHeaderType, UpsertCharacterStatisticsType } from "@/persistence/characterSchemas";

type Database = 
{
    characters?: Character[];
};

const dbFileName: string = "db.json";

const readDatabase = (): Database => 
{
    const data = fs.readFileSync(dbFileName, 'utf-8');
    return JSON.parse(data);
};

export const upsertCharacterStatistics: (id: string, characterStatistics: UpsertCharacterStatisticsType) => Promise<void> = async (id, characterStatistics) =>
{
    const database = readDatabase();

    if (!database.characters) 
    {
        database.characters = [];
    }

    const findCharacter = database.characters.find(c => c.id === id);
    if (!findCharacter)
    {
        throw new Error("Character not found");
    }

    const allCharactersExceptSpecified = database.characters.filter(c => c.id !== id);

    const characterToUpsert = { ...findCharacter, ...characterStatistics } as Character;
    database.characters = [...allCharactersExceptSpecified, characterToUpsert];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
};

export const upsertCharacterHeader: (id: string, characterHeader: UpsertCharacterHeaderType) => Promise<void> = async (id, characterHeader) =>
{
    const database = readDatabase();

    if (!database.characters) 
    {
        database.characters = [];
    }

    const findCharacter = database.characters.find(c => c.id === id);
    if (!findCharacter)
    {
        throw new Error("Character not found");
    }

    const allCharactersExceptSpecified = database.characters.filter(c => c.id !== id);

    const characterToUpsert = { ...findCharacter, ...characterHeader } as Character;
    database.characters = [...allCharactersExceptSpecified, characterToUpsert];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
};

export const upsertCharacter: (character: Character) => Promise<void> = async (character) =>
{
    const database = readDatabase();

    if (!database.characters) 
    {
        database.characters = [];
    }

    const allCharactersExceptSpecified = database.characters.filter(c => c.id !== character.id);
    database.characters = [... allCharactersExceptSpecified, character];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
}

export const getAllCharacters: () => Promise<Character[]> = async () =>
{
    const database = readDatabase();
    return database.characters ?? [];
};

export const searchCharacter: (query: string) => Promise<Character[]> = async (query) =>
{
    const database = readDatabase();
    const characters: Character[] = database.characters ?? [];
    return characters.filter(character => character.name.toLowerCase().includes(query.toLowerCase()));
};

export const getCharacter: (id: string) => Promise<Character | null> = async (id) =>
{
    const database = readDatabase();
    const characters: Character[] = database.characters ?? [];
    return characters.find(character => character.id === id) || null;
};

export const deleteCharacter: (id: string) => Promise<void> = async (id) =>
{
    const database = readDatabase();
    const allCharacters = database.characters ?? [];

    const allCharactersExceptSpecified = allCharacters.filter(c => c.id !== id);
    const newCharacters = [... allCharactersExceptSpecified ];
    const charactersAsJson = JSON.stringify(newCharacters);
    fs.writeFileSync(dbFileName, charactersAsJson, 'utf-8');
};
