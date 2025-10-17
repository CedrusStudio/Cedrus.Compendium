import { seed } from "@/../prisma/seed";

export default async function CompendiumPage()
{
  await seed();
  return (
    <div>
      CompendiumPage
    </div>
  );
};