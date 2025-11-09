import LinkButton from "@/common/components/buttons/LinkButton";

export default async function EquipmentPage()
{
  const basePath = "/compendium/equipment";

  return (
    <section className="sm:px-8 h-screen flex flex-col items-center gap-3 mt-12">
      <div className="flex h-48 grid-cols-2 gap-4">
        <LinkButton name="weapons" basePath={basePath} />
        <LinkButton name="armors" basePath={basePath} />
        <LinkButton name="shields" basePath={basePath} />
        <LinkButton name="inventory" basePath={basePath} />
        <LinkButton name="mounts" basePath={basePath} />
      </div>
    </section>
  );
};
