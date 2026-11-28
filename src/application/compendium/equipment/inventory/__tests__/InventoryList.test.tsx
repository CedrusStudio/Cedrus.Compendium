import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchEntityPayload } from "@/common/global/SearchPayloads";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { displayedText } from "@/common/translations";
import type { Item } from "@/domain/characters/equipment/Item";
import InventoryList from "../InventoryList";

const mocks = vi.hoisted(() => ({
  search: vi.fn<(query: SearchEntityPayload) => Promise<Item[]>>(),
  scope: { key: "all", filter: null as { values: string[] } | null },
}));

vi.mock("@/infrastructure/clients/searchClient", () => ({ default: { search: mocks.search } }));
vi.mock("@/common/hooks/useEntityTags", () => ({ useEntityTags: () => ({ tags: [], isLoading: false }) }));
vi.mock("@/application/compendium/character-scope/CharacterOwnedFilter", () => ({
  CharacterOwnedFilter: () => null,
  useCharacterOwnedFilter: () => mocks.scope,
}));
vi.mock("@/application/common/equipment/ItemAddSheet", () => ({ default: () => null }));
vi.mock("../InventoryItemView", () => ({ default: ({ item }: { item: Item }) => <p>{item.name}</p> }));
vi.mock("@/common/components/lists/ListHeader", () => ({
  default: ({ searchInput, handleSearchInputChange, handleExcludedTagsChange }: {
    searchInput: string;
    handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement>;
    handleExcludedTagsChange: (tags: string[]) => void;
  }) => (
    <>
      <input aria-label={displayedText.searchByName} value={searchInput} onChange={handleSearchInputChange} />
      <button onClick={() => handleExcludedTagsChange(["heavy"])}>Exclude heavy</button>
      <button onClick={() => handleExcludedTagsChange([])}>Clear excluded tags</button>
    </>
  ),
}));
vi.mock("@/common/components/WithScroll", () => ({
  WithScroll: ({ items, renderItem, hasMore, triggerNext }: {
    items: Item[];
    renderItem: (item: Item) => React.ReactNode;
    hasMore: boolean;
    triggerNext: () => void;
  }) => (
    <>
      {items.map(renderItem)}
      {hasMore && <button onClick={triggerNext}>Next page</button>}
    </>
  ),
}));

function item(name: string): Item
{
  return { id: name, name, description: "", tags: [] };
}

function renderList()
{
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><InventoryList /></QueryClientProvider>);
}

describe("character-scoped inventory filters", () =>
{
  beforeEach(() => {
    mocks.search.mockReset();
    mocks.scope = { key: "all", filter: null };
  });

  it("starts with the first cursor after excluding a tag and after clearing the filter", async () =>
  {
    const firstPage = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => item(`Inventory item ${index}`));
    mocks.search.mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([item("Second page")])
      .mockResolvedValueOnce([item("Light item")])
      .mockResolvedValueOnce(firstPage);

    renderList();
    await screen.findByText(firstPage[0].name);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Second page");
    expect(mocks.search).toHaveBeenNthCalledWith(2, expect.objectContaining({
      pagination: { cursor: firstPage.at(-1)?.id, pageSize: DEFAULT_PAGE_SIZE },
    }));

    fireEvent.click(screen.getByRole("button", { name: "Exclude heavy" }));
    await screen.findByText("Light item");
    expect(screen.queryByText("Second page")).not.toBeInTheDocument();
    expect(mocks.search).toHaveBeenNthCalledWith(3, expect.objectContaining({
      pagination: { cursor: emptyUlid, pageSize: DEFAULT_PAGE_SIZE },
      exclude: { tags: ["heavy"] },
    }));

    fireEvent.click(screen.getByRole("button", { name: "Clear excluded tags" }));
    await screen.findByText(firstPage[0].name);
    expect(screen.queryByText("Light item")).not.toBeInTheDocument();
    expect(screen.queryByText("Second page")).not.toBeInTheDocument();
    expect(mocks.search).toHaveBeenNthCalledWith(4, expect.objectContaining({
      pagination: { cursor: emptyUlid, pageSize: DEFAULT_PAGE_SIZE },
    }));
  });

  it("announces loading and empty results after searching an owned inventory", async () =>
  {
    mocks.scope = { key: "character-1-owned", filter: { values: ["Owned lantern"] } };
    mocks.search.mockResolvedValueOnce([item("Owned lantern")]).mockResolvedValueOnce([]);

    renderList();
    expect(screen.getByRole("status")).toHaveTextContent(displayedText.loading);
    await screen.findByText("Owned lantern");
    fireEvent.change(screen.getByRole("textbox", { name: displayedText.searchByName }), { target: { value: " missing " } });
    expect(screen.getByRole("status")).toHaveTextContent(displayedText.loading);
    expect(screen.queryByText("Owned lantern")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(displayedText.notFound));
    expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({
      search: expect.objectContaining({ name: "missing" }),
      pagination: { cursor: emptyUlid, pageSize: DEFAULT_PAGE_SIZE },
    }));
  });
});
