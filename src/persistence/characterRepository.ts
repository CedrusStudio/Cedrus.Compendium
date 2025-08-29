import { Character } from "@/domain/Character";
import fs from 'fs';

type Database = 
{
    characters?: Character[];
};

export type CharacterRepository = 
{
  upsert: (character: Character) => void;
  getAll: () => Character[];
  search: (query: string) => Character[];
  get: (id: string) => Character | null;
  delete: (id: string) => void;
};

const dbFileName: string = "db.json";

const readDatabase = (): Database => 
{
    const data = fs.readFileSync(dbFileName, 'utf-8');
    return JSON.parse(data);
};

export const characterRepository: CharacterRepository =
{
    upsert: (character: Character): void => 
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
    },
    getAll: (): Character[] =>
    {
        const database = readDatabase();
        return database.characters ?? [];
    },
    search: (query: string): Character[] =>
    {
        const database = readDatabase();
        const characters: Character[] = database.characters ?? [];
        return characters.filter(character => character.name.toLowerCase().includes(query.toLowerCase()));
    },
    get: (id: string) : Character | null => 
    {
        const database = readDatabase();
        const characters: Character[] = database.characters ?? [];
        return characters.find(character => character.id === id) || null;
    },
    delete: (id: string) : void => 
    {
        const database = readDatabase();
        const allCharacters = database.characters ?? [];

        const allCharactersExceptSpecified = allCharacters.filter(c => c.id !== id);
        const newCharacters = [... allCharactersExceptSpecified ];
        const charactersAsJson = JSON.stringify(newCharacters);
        fs.writeFileSync(dbFileName, charactersAsJson, 'utf-8');
    }
};
