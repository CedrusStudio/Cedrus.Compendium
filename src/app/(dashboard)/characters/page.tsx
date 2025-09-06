import CharactersGrid from "@/components/character/CharactersGrid";
import { searchCharacter, getAllCharacters } from "@/persistence/characterRepository";

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function CharactersPage(input: CharactersPageProps)
{
  const searchParams = await input.searchParams;
  const searchQuery = searchParams?.search as string | undefined;

  const allCharacters = searchQuery 
    ? await searchCharacter(searchQuery!)
    : await getAllCharacters();
  
  return (
    <div>
       <CharactersGrid characters={allCharacters} />
    </div>
  );
};
