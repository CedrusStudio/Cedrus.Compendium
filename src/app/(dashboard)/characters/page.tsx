import CharactersGrid from "@/components/character/CharactersGrid";
import { characterRepository } from "@/persistence/characterRepository";

export default function CharactersPage()
{
  const allCharacters = characterRepository.getAll();
  
  return (
    <div>
       <CharactersGrid characters={allCharacters} />
    </div>
  );
};