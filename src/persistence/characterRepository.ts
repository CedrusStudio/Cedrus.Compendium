"use server";

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import { Character, CreateEmptyCharacter } from "@/domain/characters/Character";
import fs from 'fs';
import { ulid } from 'ulid';
import { StatisticsDto } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { TalentsDto } from '@/persistence/schemas/characters/talentSchema';
import { EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { DetailsDto, HeaderDto } from '@/persistence/schemas/characters/headerSchema';
import { CombatDto } from '@/persistence/schemas/characters/combat/combatSchema';

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

//Queries
export const getCharacterById: (id: string) => Promise<Character | null> = async (id) =>
{
    const database = readDatabase();
    const characters: Character[] = database.characters ?? [];
    return characters.find(character => character.id === id) || null;
};

export const getAllCharacters: () => Promise<Character[]> = async () =>
{
    const database = readDatabase();
    return database.characters ?? [];
};

export const searchCharacters: (query: string) => Promise<Character[]> = async (query) =>
{
    const database = readDatabase();
    const characters: Character[] = database.characters ?? [];
    return characters.filter(character => character.name.toLowerCase().includes(query.toLowerCase()));
};

//Commands
export const addCharacter: (characterHeader: HeaderDto) => Promise<string> = async (characterHeader) =>
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
        ...CreateEmptyCharacter(characterHeader),
        id: ulid(),
    } as Character;
    
    database.characters = [...allCharactersExceptSpecified, characterToAdd];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
    return characterToAdd.id;
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

export const upsertCharacterStatistics: (id: string, characterStatistics: StatisticsDto) => Promise<void> = async (id, characterStatistics) =>
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

export const upsertCharacterTalents: (id: string, characterTalents: TalentsDto) => Promise<void> = async (id, characterTalents) =>
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
    
    const talentsArray = findCharacter.talents.map(t => characterTalents.talents.filter(nt => nt.id === t.id)[0] ?? t);
    const characterToUpsert = { ...findCharacter, talents: talentsArray } as Character;
    database.characters = [...allCharactersExceptSpecified, characterToUpsert];
    const databaseAsJson = JSON.stringify(database);
    fs.writeFileSync(dbFileName, databaseAsJson, 'utf-8');
};

export const upsertCharacterEquipment: (id: string, characterEquipment: EquipmentDto) => Promise<void> = async (id, characterEquipment) =>
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

export const updateCharacterDetails: (id: string, characterHeader: DetailsDto) => Promise<void> = async (id, characterHeader) =>
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

export const upsertCharacterCombat: (id: string, characterCombat: CombatDto) => Promise<void> = async (id, characterCombat) =>
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