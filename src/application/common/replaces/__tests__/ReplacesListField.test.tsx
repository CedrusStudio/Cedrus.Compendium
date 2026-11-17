import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm, useWatch } from "react-hook-form";

/**
 * The combobox itself is a Radix popover over cmdk — pointless to drive here.
 * Stubbed with a plain input so the test can assert what this component owns:
 * adding, changing and removing rows, and what it hands the picker (group,
 * warning flag, self-exclusion).
 */
const comboboxSpy = vi.fn();

vi.mock("@/application/common/requirements/EntityNameCombobox", () => ({
  __esModule: true,
  default: (props: { value: string; onChange: (name: string) => void }) => {
    comboboxSpy(props);
    return (
      <input
        data-testid="entity-name-combobox"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    );
  },
}));

import ReplacesListField from "@/application/common/replaces/ReplacesListField";

type Values = { name: string; replaces: string[] };

function Harness({ defaultValues, onValues }: { defaultValues: Values; onValues?: (values: Values) => void })
{
  const form = useForm<Values>({ defaultValues });

  return (
    <FormProvider {...form}>
      <ReplacesListField group="maneuvers" />
      <FormValuesProbe onValues={onValues} />
    </FormProvider>
  );
}

function FormValuesProbe({ onValues }: { onValues?: (values: Values) => void })
{
  const values = useWatch<Values>();
  onValues?.({ name: values?.name ?? "", replaces: values?.replaces ?? [] });
  return null;
}

const renderField = (defaultValues: Values) =>
{
  let latest: Values = defaultValues;
  render(<Harness defaultValues={defaultValues} onValues={(values) => { latest = values; }} />);
  return () => latest;
};

describe("ReplacesListField", () => {
  it("renders one picker per replaced name", () => {
    renderField({ name: "Antyzapał Wojmistrza", replaces: ["Antyzapał", "Młyniec"] });

    const inputs = screen.getAllByTestId("entity-name-combobox") as HTMLInputElement[];
    expect(inputs.map((input) => input.value)).toEqual(["Antyzapał", "Młyniec"]);
  });

  it("says so when nothing is replaced", () => {
    renderField({ name: "Cios", replaces: [] });

    expect(screen.getByText("Nic nie zastępuje.")).toBeTruthy();
    expect(screen.queryByTestId("entity-name-combobox")).toBeNull();
  });

  it("appends an empty row — the schema strips it if left unfilled", async () => {
    const user = userEvent.setup();
    const values = renderField({ name: "Cios", replaces: [] });

    await user.click(screen.getByText("+ Dodaj zastąpienie"));

    await waitFor(() => expect(values().replaces).toEqual([""]));
  });

  it("writes the picked name back into the array", async () => {
    const user = userEvent.setup();
    const values = renderField({ name: "Cios", replaces: [""] });

    await user.type(screen.getByTestId("entity-name-combobox"), "Młyniec");

    await waitFor(() => expect(values().replaces).toEqual(["Młyniec"]));
  });

  it("removes the row it was asked to remove, keeping the rest", async () => {
    const user = userEvent.setup();
    const values = renderField({ name: "Cios", replaces: ["Antyzapał", "Młyniec"] });

    await user.click(screen.getAllByLabelText("Usuń zastąpienie")[0]!);

    await waitFor(() => expect(values().replaces).toEqual(["Młyniec"]));
  });

  it("asks the picker for its own group, flags unknown names and hides the edited entity", () => {
    comboboxSpy.mockClear();
    renderField({ name: "Antyzapał Wojmistrza", replaces: ["Antyzapał"] });

    expect(comboboxSpy).toHaveBeenCalledWith(expect.objectContaining({
      group: "maneuvers",
      unknownWarning: true,
      excludeNames: ["Antyzapał Wojmistrza"],
    }));
  });
});
