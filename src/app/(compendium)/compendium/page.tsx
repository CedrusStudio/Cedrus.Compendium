import { seed } from "@/../prisma/seed";
import { getCharacterById } from "@/persistence/charactersRepository";

export default async function CompendiumPage()
{
  await seed();

  const igarId = "01K79QFH0ZD99MSBV4ACKFBZYN";
  const igar = await getCharacterById(igarId);

  if (!igar) return <div>Character not found</div>; 

  console.log(igar);
  return (
    <div>
      <h1>Compendium Page</h1>
      <h2>{igar.name}</h2>
      <p>{igar.description}</p>
      <h3>Details:</h3>
      <ul>
      {
        Object.keys(igar).map(key =>
          <li key={key}>{key}: </li>
        )
      }
      </ul>
    </div>
  );
};