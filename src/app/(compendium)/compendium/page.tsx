import LinkButton from "@/common/components/buttons/LinkButton";

export default async function CompendiumPage()
{
  const basePath = "/compendium";

  return (
    <section className="sm:px-8 h-screen flex flex-col items-center gap-3 mt-12">

      <div className="flex h-48 grid-cols-2 gap-4">
        <LinkButton name="maneuvers" basePath={basePath} />
        <LinkButton name="perks" basePath={basePath} />
        <LinkButton name="stances" basePath={basePath} />
        <LinkButton name="states" basePath={basePath} />
        <LinkButton name="spells" basePath={basePath} />
      </div>

      {/* <div className="flex gap-3">
        <LinkButton name="powers" basePath={basePath} />
        <LinkButton name="equipment" basePath={basePath} />
        <LinkButton name="talents" basePath={basePath} />
      </div> */}

    </section>
  );
};
