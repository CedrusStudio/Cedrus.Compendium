import { useState, type ChangeEvent } from "react";
import { useDebounce } from "use-debounce";
import { anyOfValues, type SearchEntityPayload } from "@/common/global/SearchPayloads";

export function useGroupedNameSearch(resetPage: (page: number) => void) {
  const [search, setSearch] = useState({ text: "", exact: false });
  const [debouncedText] = useDebounce(search.text, 300);
  const groupName = search.exact ? search.text : null;

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch({ text: event.target.value, exact: false });
    resetPage(1);
  };

  const handleScopeToGroup = (name: string) => {
    if (name === groupName) return;
    setSearch({ text: name, exact: true });
    resetPage(1);
  };

  return { searchInput: search.text, searchTerm: groupName ?? debouncedText, groupName, handleSearchInputChange, handleScopeToGroup };
}

export function narrowToGroup(query: SearchEntityPayload, groupName: string | null) {
  if (groupName !== null) query.search = { ...query.search, name: anyOfValues([groupName]) };
}
