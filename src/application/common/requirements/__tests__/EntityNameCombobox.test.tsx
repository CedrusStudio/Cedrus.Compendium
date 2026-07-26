import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const namesState = { names: ["Antyzapał", "Młyniec"], isLoading: false };

vi.mock("@/common/hooks/useEntityNames", () => ({
  useEntityNames: () => namesState,
}));

import EntityNameCombobox from "@/application/common/requirements/EntityNameCombobox";

const WARNING = "Brak encji o tej nazwie w Kompendium";

describe("EntityNameCombobox — unknown name warning", () => {
  it("stays quiet by default, even for a name outside the library", () => {
    render(<EntityNameCombobox group="maneuvers" value="Cokolwiek" onChange={() => {}} />);

    expect(screen.queryByLabelText(WARNING)).toBeNull();
  });

  it("flags a value matching no entity when asked to", () => {
    render(<EntityNameCombobox group="maneuvers" value="Cokolwiek" onChange={() => {}} unknownWarning />);

    expect(screen.getByLabelText(WARNING)).toBeTruthy();
  });

  it("accepts a known name regardless of case", () => {
    render(<EntityNameCombobox group="maneuvers" value="antyzapał" onChange={() => {}} unknownWarning />);

    expect(screen.queryByLabelText(WARNING)).toBeNull();
  });

  it("says nothing about an empty value", () => {
    render(<EntityNameCombobox group="maneuvers" value="" onChange={() => {}} unknownWarning />);

    expect(screen.queryByLabelText(WARNING)).toBeNull();
  });

  it("withholds the warning while the name list is still loading", () => {
    namesState.isLoading = true;
    try
    {
      render(<EntityNameCombobox group="maneuvers" value="Cokolwiek" onChange={() => {}} unknownWarning />);
      expect(screen.queryByLabelText(WARNING)).toBeNull();
    }
    finally
    {
      namesState.isLoading = false;
    }
  });
});
