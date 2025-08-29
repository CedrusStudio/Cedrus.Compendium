import CharactersGrid from "@/components/character/CharactersGrid";
import { characterRepository } from "@/persistence/characterRepository";

type CharactersPageProps = 
{
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function CharactersPage({ searchParams }: CharactersPageProps)
{
  const searchQuery = searchParams?.search as string | undefined;

  const allCharacters = searchQuery 
    ? characterRepository.search(searchQuery!)
    : characterRepository.getAll();
  
  return (
    <div>
       <CharactersGrid characters={allCharacters} />
    </div>
  );
};
