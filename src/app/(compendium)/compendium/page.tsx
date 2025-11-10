import LinkButton from "@/common/components/buttons/LinkButton";

export default async function CompendiumPage()
{
  const basePath = "/compendium";

  return (
    <section className="sm:px-8 flex flex-col items-center gap-5 p-6">

      <div>
        <LinkButton name="perks" basePath={basePath} />
      </div>
      <div className="flex gap-5">
        <LinkButton name="stances" basePath={basePath} />
        <LinkButton name="states" basePath={basePath} />
      </div>

      <div className="flex gap-5">
        <LinkButton name="maneuvers" basePath={basePath} />
        <LinkButton name="spells" basePath={basePath} />
      </div>

      <div className="flex gap-5">
        <LinkButton name="equipment" basePath={basePath} />
      </div>

    </section>
  );
};
