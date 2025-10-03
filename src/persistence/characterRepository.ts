"use server";

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import { Character, emptyCharacter, Talent } from "@/domain/Character";
import fs from 'fs';
import { AddCharacterHeaderType, UpsertCharacterCombatType, UpsertCharacterEquipmentType, UpsertCharacterHeaderType, UpsertCharacterStatisticsType, UpsertCharacterTalentsType } from "@/persistence/characterSchemas";

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

export const upsertCharacterTalents: (id: string, characterTalents: UpsertCharacterTalentsType) => Promise<void> = async (id, characterTalents) =>
{
    console.log("Upserting talents for character ID:", id);
    console.log("New talents data:", characterTalents);
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
    
    const talentsArray = findCharacter.talents.map(t => characterTalents.talents.filter(nt => nt.id === t.id)[0] ?? t);
    const characterToUpsert = { ...findCharacter, talents: talentsArray } as Character;
    database.characters = [...allCharactersExceptSpecified, characterToUpsert];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
};

export const upsertCharacterEquipment: (id: string, characterEquipment: UpsertCharacterEquipmentType) => Promise<void> = async (id, characterEquipment) =>
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

    const characterToUpsert = { ...findCharacter, equipment: characterEquipment } as Character;
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

export const addCharacter: (characterHeader: AddCharacterHeaderType) => Promise<string> = async (characterHeader) =>
{
    const database = readDatabase();

    if (!database.characters) 
    {
        database.characters = [];
    }

    const findCharacter = database.characters.find(c => c.name.toLowerCase() === characterHeader.name.toLowerCase());
    if (findCharacter)
    {
        throw new Error("Character with the same name already exists");
    }

    const allCharactersExceptSpecified = database.characters.filter(c => c.name.toLowerCase() !== characterHeader.name.toLowerCase());

    const characterToAdd = { 
        ...emptyCharacter,
        ...characterHeader, 
        id: characterHeader.name.replace(/\s+/g, '-').toLowerCase(),
    } as Character;
    database.characters = [...allCharactersExceptSpecified, characterToAdd];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
    return characterToAdd.id;
};

export const upsertCharacterCombat: (id: string, characterCombat: UpsertCharacterCombatType) => Promise<void> = async (id, characterCombat) =>
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

    const characterToUpsert = { ...findCharacter, ...characterCombat } as Character;

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
    database.characters = allCharactersExceptSpecified;
    const charactersAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, charactersAsJson, 'utf-8');
};
