# Backup MongoDB Atlas (M0) -- opcje 2 i 3

## Backup z poziomu Node.js

Jeżeli aplikacja jest napisana w Node.js, można wyeksportować każdą
kolekcję do pliku JSON.

### Przykładowy skrypt

``` js
import { MongoClient } from "mongodb";
import fs from "fs";

const client = new MongoClient(process.env.MONGO_URI);

await client.connect();

const db = client.db("moja_baza");
const collections = await db.listCollections().toArray();

fs.mkdirSync("backup", { recursive: true });

for (const { name } of collections) {
  const docs = await db.collection(name).find().toArray();

  fs.writeFileSync(
    `backup/${name}.json`,
    JSON.stringify(docs, null, 2)
  );
}

await client.close();
```

### Efekt

``` text
backup/
├── users.json
├── posts.json
├── comments.json
└── ...
```

### Zalety

-   Backup w czytelnym formacie JSON.
-   Łatwo analizować dane lub przechowywać je w repozytorium.
-   Można zautomatyzować jako część aplikacji lub procesu CI/CD.

### Wady

-   Nie zachowuje wszystkich typów BSON w oryginalnej postaci.
-   Odtworzenie bazy wymaga własnego skryptu importującego lub użycia
    `mongoimport`.
