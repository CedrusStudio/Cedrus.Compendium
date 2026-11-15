// These are CLI boundary tests. Files, Prisma delegates and process arguments
// are replaced before importing either entry point; no database is accessed.
import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  read: vi.fn(), find: vi.fn(), update: vi.fn(), disconnect: vi.fn(),
}));
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, default: { ...actual, readFileSync: mocks.read }, readFileSync: mocks.read };
});
vi.mock("@/lib/prisma", () => ({ default: {
  maneuver: { findFirst: mocks.find, update: mocks.update },
  stance: { findFirst: mocks.find, update: mocks.update },
  state: { findFirst: mocks.find, update: mocks.update },
  $disconnect: mocks.disconnect,
} }));

const originalArgs = process.argv;
const originalExitCode = process.exitCode;
afterEach(() => { process.argv = originalArgs; process.exitCode = originalExitCode; });

const commands = [
  { name: "maneuver", args: ["fixture.csv"], load: () => import("../../../scripts/import-maneuver-effects") },
  { name: "stance", args: ["stance", "fixture.csv"], load: () => import("../../../scripts/import-mode-effects") },
  { name: "state", args: ["state", "fixture.csv"], load: () => import("../../../scripts/import-mode-effects") },
];

for (const command of commands)
{
  it.each([false, true])(`${command.name} CLI validates nested payloads and uses parsed data (mock apply=%s)`, async apply =>
  {
    vi.resetModules();
    const { registerPlugin } = await import("@/domain/combat-lab/plugins/registry");
    registerPlugin({ id: "test", name: "Test", version: "1", effects: [{
      effectType: "normalized", apply() {}, describe: () => "",
      schema: z.object({ amount: z.number().default(4) }),
    }] });
    const payloads = [
      { type: "custom", effectType: "normalized", data: {} },
      { type: "chance", chance: 50, then: [{ type: "push", distance: 1, typo: 1 }] },
      { type: "custom", effectType: "lifesteal", data: { amount: 1, typo: 1 } },
      { type: "resource", resource: "mana", delta: 1 },
      { type: "custom", effectType: "unknown", data: {} },
    ];
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    mocks.read.mockReturnValue("name,grade,approve,proposedEffects\n" + payloads.map((payload, index) =>
      `Effect${index},1,yes,${cell(JSON.stringify([payload]))}`).join("\n"));
    mocks.find.mockResolvedValue({ id: "accepted" });
    mocks.update.mockResolvedValue({ id: "accepted" });
    const finished = new Promise<void>(resolve => mocks.disconnect.mockImplementation(async () => resolve()));
    vi.spyOn(console, "log").mockImplementation(() => {});
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.argv = ["node", "script", ...command.args, ...(apply ? ["--apply"] : [])];

    await command.load();
    await finished;
    expect(warning).toHaveBeenCalledTimes(4);
    expect(mocks.find).toHaveBeenCalledOnce();
    expect(mocks.find).toHaveBeenCalledWith({ where: { name: "Effect0", grade: 1 }, select: { id: true } });
    if (!apply)
    {
      expect(mocks.update).not.toHaveBeenCalled();
      return;
    }

    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "accepted" }, data: {
      effects: [{ type: "custom", effectType: "normalized", data: { amount: 4 } }],
      simulatable: true, unsupportedReason: null,
    } });
  });
}

it.each([false, true])("offline snapshot audit reports validation issues and exit status (invalid=%s)", async invalid =>
{
  vi.resetModules();
  process.exitCode = undefined;
  process.argv = ["node", "audit", "fixture-backup"];
  const effect = { type: "chance", chance: 50, then: [{ type: "push", distance: 1, ...(invalid ? { typo: 1 } : {}) }] };
  mocks.read.mockImplementation((path: string) => JSON.stringify(path.endsWith("Maneuver.json") ? [{ effects: [effect] }] : []));
  const output = vi.spyOn(console, "log").mockImplementation(() => {});
  await import("../../../scripts/audit-effect-authoring");
  const report = JSON.parse(output.mock.calls[0][0]);
  expect(report[0]).toMatchObject({ records: 1, withEffects: 1, effectCount: 1 });
  expect(mocks.find).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  if (invalid)
  {
    expect(process.exitCode).toBe(1);
    expect(report[0].invalid[0].issues[0].path).toEqual([0, "then", 0, "typo"]);
    return;
  }
  expect(process.exitCode).toBeUndefined();
  expect(report[0].invalid).toEqual([]);
});
