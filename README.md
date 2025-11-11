## Jak odpalic synchronizacje .json plikó rulebook

> npm run sync-rulebook

# TODO

Bestiary + Battle + Edit Talents Table + Talents Table

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedCategory(value);
    table.getColumn(columnKeys.tags)?.setFilterValue(value !== "all" ? value : "");
  };

    <SelectFilter 
        options={["rogal", "bohater"]}
        selectedOption={selectedCategory}
        handleOnSelectedValueChange={handleOnSelectedValueChange}
        columnKey={columnKeys.tags}
        allOption={displayedText.all}
    />

Polepszych performance do importów - prekalkulowac idki odpowiednie

## Prioritized

5. refactor the item view, because mp they are not that readable, especially that view contains accordion content. Plus consider what to do on compendium level
6. fix the bugs of items view like weapons damage views and critical view (make weapon its crit rage and power)

soft delete

paginacja ile na strone

## Commands

Generate clients:

> npx prisma generate

Seeding data:

> npx prisma db seed

For multiple .env.local

> npm install -g dotenv-cli

### Other

https://ui.shadcn.com/docs/components/button-group
button group dla tych strzałek w gore i dol do zwiekszania i zmniejszania
enable two languages = select in configuration

-------------------------
-> castTime przetłumaczyć na czas aktywacji

search -> with tag - without tag (dodawanie tagów i sie pojawia i tak samo)

szukania po: postaci, tagu (check boxy)