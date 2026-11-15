import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { typedZodResolver } from "@/common/global/validation";
import { effectsAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";
import { ManeuverEffectsEditableFields } from "../ManeuverEffectsEditableFields";

const custom = { type: "custom", effectType: "lifesteal", data: { amount: 2 } };
type Data = { id: string; effects: unknown[] };
const schema = z.object({ id: z.string(), effects: effectsAuthoringSchema });

function setup(effects: unknown[] = [custom])
{
  const save = vi.fn();
  function Editor()
  {
    const form = useForm<Data>({ defaultValues: { id: "first", effects }, resolver: typedZodResolver<Data>(schema) });
    return <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(save)}>
        <ManeuverEffectsEditableFields />
        <button type="submit">Save</button>
        <button type="button" onClick={() => form.reset({ id: "first", effects: [{ ...custom, data: { amount: 8 } }] })}>Reset</button>
        <button type="button" onClick={() => form.reset({ id: "second", effects: [{ ...custom, data: { amount: 9 } }] })}>Other record</button>
      </form>
    </FormProvider>;
  }
  render(<Editor />);
  return save;
}

const json = () => screen.getByRole("textbox", { name: "Dane pluginu (JSON obiektu)" });
const submit = () => act(async () => { fireEvent.click(screen.getByRole("button", { name: "Save" })); });

it.each(['{"amount":', 'null', '[]', '3', '{"amount":"two"}', '{"amount":2,"typo":1}'])("keeps %s visible and prevents a resolver from submitting an earlier value", async text =>
{
  const save = setup();
  fireEvent.change(json(), { target: { value: text } });
  expect(json()).toHaveValue(text);
  expect(json()).toHaveAttribute("aria-invalid", "true");
  expect(json()).toHaveAccessibleDescription(/JSON/);
  expect(screen.getByRole("status")).toHaveTextContent("Podgląd niedostępny");
  await submit();
  expect(save).not.toHaveBeenCalled();
  expect(json()).toHaveFocus();

  fireEvent.change(json(), { target: { value: ' { "amount" : 5 } ' } });
  expect(json()).toHaveValue(' { "amount" : 5 } ');
  expect(json()).toHaveAttribute("aria-invalid", "false");
  expect(screen.getByRole("status")).not.toHaveTextContent("Podgląd niedostępny");
  await submit();
  expect(save).toHaveBeenCalledWith({ id: "first", effects: [{ ...custom, data: { amount: 5 } }] }, expect.anything());
});

it("retains an invalid nested draft and its identity after removing an earlier row", async () =>
{
  const nested = { type: "when", condition: { kind: "onCritical" }, then: [custom] };
  const save = setup([{ type: "push", distance: 2 }, nested]);
  fireEvent.change(json(), { target: { value: '{"amount":' } });
  const inputId = json().id;
  fireEvent.click(screen.getAllByRole("button", { name: "Usuń efekt" })[0]);
  expect(json().id).toBe(inputId);
  expect(json()).toHaveValue('{"amount":');
  await submit();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(json(), { target: { value: '{"amount":4}' } });
  await submit();
  expect(save).toHaveBeenCalledWith({ id: "first", effects: [{ ...nested, then: [{ ...custom, data: { amount: 4 } }] }] }, expect.anything());
});

it("discards local drafts on reset and when switching records", async () =>
{
  const save = setup();
  fireEvent.change(json(), { target: { value: '{"amount":' } });
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  await waitFor(() => expect(json()).toHaveValue(JSON.stringify({ amount: 8 }, null, 2)));
  fireEvent.change(json(), { target: { value: 'null' } });
  fireEvent.click(screen.getByRole("button", { name: "Other record" }));
  await waitFor(() => expect(json()).toHaveValue(JSON.stringify({ amount: 9 }, null, 2)));
  await submit();
  expect(save).toHaveBeenCalledWith({ id: "second", effects: [{ ...custom, data: { amount: 9 } }] }, expect.anything());
});

it("revalidates the draft after changing the plugin key", async () =>
{
  const save = setup();
  fireEvent.change(screen.getByLabelText("effectType (klucz pluginu)"), { target: { value: "missing" } });
  expect(json()).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(json(), { target: { value: '{"amount":6}' } });
  await submit();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("effectType (klucz pluginu)"), { target: { value: "lifesteal" } });
  expect(json()).toHaveAttribute("aria-invalid", "false");
  await submit();
  expect(save).toHaveBeenCalledOnce();
});

it("keeps malformed whole-effect JSON editable until it is replaced with a supported effect", async () =>
{
  const save = setup([{ type: "future", value: 1 }]);
  const raw = screen.getByRole("textbox", { name: "Efekt (JSON)" });
  fireEvent.change(raw, { target: { value: '{"type":' } });
  expect(raw).toHaveValue('{"type":');
  await submit();
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(raw, { target: { value: '{"type":"push","distance":4}' } });
  expect(screen.queryByRole("textbox", { name: "Efekt (JSON)" })).not.toBeInTheDocument();
  await submit();
  expect(save).toHaveBeenCalledWith({ id: "first", effects: [{ type: "push", distance: 4 }] }, expect.anything());
});
