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

## Prioritized

4. importy
5. tworzenie postacie na podstawie innej.

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

zmiany opisu jako text area

szukania po: postaci, categorii (check boxy)

