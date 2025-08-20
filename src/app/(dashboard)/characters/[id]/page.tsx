type CharacterProps = 
{
    params: 
    {
        id: string;
    };
};

export default async function CharacterPage(input: CharacterProps)
{
  const params = await input.params;

  return (
    <div>
      CharacterPage{params.id ?? "my id"}
    </div>
  );
};