import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { typedZodResolver } from "@/common/global/validation";
import { healthSchema } from "@/persistence/schemas/characters/combat/healthSchema";
import EditHealthCard from "../EditHealthCard";

it("blocks a blank barrier and submits an explicitly entered zero from the health card", async () => {
  const schema = z.object({ health: healthSchema });
  const health = { barrier: 3, vitality: 15, toughness: 4, recoveryLevel: 1, lethalHealth: 2, lethalRounds: 1, bonus: -1 };
  const save = vi.fn();
  function Editor() {
    const form = useForm({ defaultValues: { health }, resolver: typedZodResolver(schema) });
    return <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(values => save(values))}>
        <EditHealthCard health={health} />
        <button type="submit">Zapisz</button>
      </form>
    </FormProvider>;
  }
  const user = userEvent.setup();
  render(<Editor />);
  const barrier = screen.getByRole("textbox", { name: /^bariera$/i });
  const submit = screen.getByRole("button", { name: "Zapisz" });
  await user.clear(barrier);
  await user.click(submit);
  await waitFor(() => expect(barrier).toHaveAccessibleDescription("Uzupełnij pole"));
  expect(save).not.toHaveBeenCalled();
  await user.type(barrier, "0");
  await user.click(submit);
  await waitFor(() => expect(save).toHaveBeenCalledWith({ health: { ...health, barrier: 0 } }));
  expect(barrier).not.toHaveAttribute("aria-describedby");
});
