import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import ReplacesView from "@/application/common/ReplacesView";

describe("ReplacesView", () => {
  it("renders nothing when the entity replaces nothing", () => {
    const { container } = render(<ReplacesView entity={{}} group="maneuvers" />);
    expect(container.firstChild).toBeNull();
  });

  it("links each name into its group's compendium list", () => {
    render(<ReplacesView entity={{ replaces: ["Antyzapał"] }} group="maneuvers" />);

    const link = screen.getByText("Antyzapał") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/compendium/maneuvers?search=Antyzapa%C5%82");
  });

  it("escapes names with spaces", () => {
    render(<ReplacesView entity={{ replaces: ["Zbicie Ciosu"] }} group="stances" />);

    const link = screen.getByText("Zbicie Ciosu") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/compendium/stances?search=Zbicie%20Ciosu");
  });
});
