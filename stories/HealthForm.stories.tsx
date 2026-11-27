import type { Meta, StoryObj } from "@storybook/nextjs";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import EditHealthCard from "@/application/characters/edit/combat/EditHealthCard";
import { typedZodResolver } from "@/common/global/validation";
import { healthSchema, type HealthDto } from "@/persistence/schemas/characters/combat/healthSchema";

const health: HealthDto = {
  barrier: 0, vitality: 12, toughness: 3, recoveryLevel: 1, lethalHealth: 1, lethalRounds: 0, bonus: 0,
};
const schema = z.object({ health: healthSchema });

function HealthForm({ width, disabled, dark }: { width: number; disabled: boolean; dark: boolean })
{
  const form = useForm<z.infer<typeof schema>>({
    defaultValues: { health }, mode: "onBlur", resolver: typedZodResolver(schema),
  });
  return (
    <main className={dark ? "dark bg-background text-foreground" : "bg-background text-foreground"} style={{ width, maxWidth: "100%" }} lang="pl">
      <FormProvider {...form}>
        <form aria-label="Zdrowie postaci" onSubmit={event => event.preventDefault()}>
          <fieldset className="min-w-0" disabled={disabled} aria-label="Parametry zdrowia">
            <EditHealthCard health={health} />
          </fieldset>
        </form>
      </FormProvider>
    </main>
  );
}

const meta = {
  title: "Characters/Health form", component: HealthForm, args: { width: 720, disabled: false, dark: false },
} satisfies Meta<typeof HealthForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Narrow: Story = { args: { width: 304 } };
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { args: { dark: true } };
