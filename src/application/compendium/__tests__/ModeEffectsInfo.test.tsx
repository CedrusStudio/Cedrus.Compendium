import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Mode } from "@/domain/characters/combat/Mode";

vi.mock("@/domain/combat-lab/effects/describeManeuver", () => ({
  describeManeuver: () => "opis efektów",
}));

import ModeEffectsInfo from "@/application/compendium/ModeEffectsInfo";

const mode = (overrides: Partial<Mode>): Mode => ({
  id: "1",
  name: "Postawa Defensywna",
  grade: 1,
  description: "",
  price: 0,
  tags: [],
  ...overrides,
} as Mode);

describe("ModeEffectsInfo", () => {
  it("mówi wprost, że tryb czeka na zmapowanie", () => {
    render(<ModeEffectsInfo mode={mode({})} />);

    expect(screen.getByText("do zmapowania")).toBeTruthy();
  });

  it("pokazuje liczbę efektów i opis, gdy tryb jest zmapowany", () => {
    render(<ModeEffectsInfo mode={mode({ effects: [{ type: "stat", mode: "self", duration: 1, protection: 2 }] })} />);

    expect(screen.getByText(/Zmapowany · 1 efekt/)).toBeTruthy();
    expect(screen.getByText("opis efektów")).toBeTruthy();
  });

  it("niesymulowalny tryb wygrywa z liczbą efektów i pokazuje powód", () => {
    render(<ModeEffectsInfo mode={mode({ simulatable: false, unsupportedReason: "zależy od decyzji MG" })} />);

    expect(screen.getByText("Niesymulowalny")).toBeTruthy();
    expect(screen.getByText("zależy od decyzji MG")).toBeTruthy();
  });
});
