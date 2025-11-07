"use client";

type RequirementsViewProps =
{
    entityWithRequirements: { requirements: string[] };
};

export default function RequirementsView({ entityWithRequirements }: RequirementsViewProps)
{
  const { requirements } = entityWithRequirements;

  return (
    <>
    {
        requirements.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1">
            {
                requirements.map(requirement => (
                    <span key={requirement} className="text-sm border rounded-full px-2 py-1">
                        {requirement}
                    </span>
                ))
            }
            </div>
        )
    }
    </>
  );
};