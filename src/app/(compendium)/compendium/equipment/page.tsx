import LinkButton from "@/common/components/buttons/LinkButton";

export default async function EquipmentPage()
{
  const basePath = "/compendium/equipment";

  return (
    <section className="sm:px-8 flex flex-col items-center gap-5 p-6">
        <LinkButton name="weapons" basePath={basePath} />
        <LinkButton name="armors" basePath={basePath} />
        <LinkButton name="shields" basePath={basePath} />
        <LinkButton name="inventory" basePath={basePath} />
        <LinkButton name="mounts" basePath={basePath} />
    </section>
  );
};
