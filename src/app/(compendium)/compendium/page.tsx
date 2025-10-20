import { getCharacterById } from "@/persistence/charactersRepository";

export default async function CompendiumPage()
{
  const igarId = "01K79QFH0ZD99MSBV4ACKFBZYN";
  const igar = await getCharacterById(igarId);

  if (!igar) return <div>Character not found</div>; 

  return (
    <div>
      <h1>Compendium Page</h1>
      <h2>{igar.name}</h2>
      <p>{igar.description}</p>
      <h3>Details:</h3>
      <ul>
      {
        (
          Object.keys(igar) as (keyof typeof igar)[]).map(key =>
            <li key={key}>{key}: [ {JSON.stringify(igar[key])} ]</li>
        )
      }
      </ul>
    </div>
  );
};