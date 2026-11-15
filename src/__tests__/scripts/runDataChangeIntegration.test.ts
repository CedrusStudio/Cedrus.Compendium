import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { integrationConfiguration, runIntegrationAcceptance } from "../../../scripts/run-data-change-integration.mjs";

const roots: string[] = [];
const runId = "00000000-0000-4000-8000-000000000001";
const container = "c".repeat(64);
afterEach(() =>
{
  for (const root of roots.splice(0))
  {
    const absolute = path.resolve(root);
    if (!absolute.startsWith(path.resolve(tmpdir()) + path.sep) || !path.basename(absolute).startsWith("cedrus-acceptance-test-")) throw new Error("Invalid test cleanup path.");
    rmSync(absolute, { recursive: true, force: true });
  }
});

function fixture(problem?: "docker" | "tests" | "skip" | "ownership")
{
  const root = mkdtempSync(path.join(tmpdir(), "cedrus-acceptance-test-")); roots.push(root);
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "cedrus-compendium" }));
  const calls: { file: string; args: string[]; env: Record<string, string | undefined> }[] = [];
  async function executeCommand(file: string, args: string[], options: { env?: Record<string, string | undefined> } = {})
  {
    calls.push({ file, args, env: options.env ?? {} });
    if (args[0] === "context") return { code: 0, stdout: JSON.stringify("npipe:////./pipe/local-test-engine"), stderr: "" };
    if (args[0] === "info") return { code: problem === "docker" ? 1 : 0, stdout: "linux", stderr: problem === "docker" ? "Synthetic Docker denial" : "" };
    if (args[0] === "create") return { code: 0, stdout: container, stderr: "" };
    if (args[0] === "inspect") return { code: 0, stdout: args[2] === "{{.Image}}" ? "sha256:test-image" : problem === "ownership" ? "other-owner" : runId, stderr: "" };
    if (args.includes("--reporter=json"))
    {
      if (problem === "tests") return { code: 1, stdout: "", stderr: "Synthetic test failure" };
      const report = args.find(value => value.startsWith("--outputFile="))!.slice("--outputFile=".length);
      mkdirSync(path.dirname(report), { recursive: true });
      writeFileSync(report, JSON.stringify({ success: true, numTotalTests: 3, numPassedTests: problem === "skip" ? 0 : 3, numPendingTests: problem === "skip" ? 3 : 0, numFailedTests: 0 }));
    }
    return { code: 0, stdout: "", stderr: "" };
  }
  return { root, calls, executeCommand };
}

it("constructs only a loopback test database and rejects invalid configuration", () =>
{
  expect(integrationConfiguration(27027, runId).url).toContain("mongodb://127.0.0.1:27027/cedrus_data_change_test_");
  expect(integrationConfiguration(27027, runId).url).toContain("directConnection=true");
  for (const port of [0, 80, 65536, 1.5, NaN]) expect(() => integrationConfiguration(port, runId)).toThrow();
  expect(() => integrationConfiguration(27027, "../foreign")).toThrow();
});

it("overrides application database URLs and removes only its labeled container", async () =>
{
  const { root, calls, executeCommand } = fixture();
  const receipt = await runIntegrationAcceptance({ root, runId, executeCommand, log: () => {}, environment: { DATABASE_CONNECTION_STRING: "mongodb://do-not-use/production", DATA_CHANGE_TEST_DATABASE_URL: "mongodb://do-not-use/production" } });
  expect(receipt.status).toBe("PASS");
  expect(receipt.cleanedUp).toBe(true);
  expect(receipt.passedTests).toBe(3);
  const create = calls.find(call => call.args[0] === "create")!;
  expect(create.args).toContain("127.0.0.1:27027:27017");
  expect(create.args).toContain(`cedrus-compendium-test-run=${runId}`);
  expect(calls.filter(call => call.args.includes("db") || call.args.includes("--reporter=json")).every(call => call.env.DATABASE_CONNECTION_STRING?.startsWith("mongodb://127.0.0.1:27027/cedrus_data_change_test_"))).toBe(true);
  expect(calls.at(-1)?.args).toEqual(["rm", "--force", "--volumes", container]);
});

it.each(["tests", "skip"] as const)("does not report a pass for %s and still cleans its container", async problem =>
{
  const { root, calls, executeCommand } = fixture(problem);
  await expect(runIntegrationAcceptance({ root, runId, executeCommand, log: () => {}, environment: {} })).rejects.toThrow();
  expect(calls.at(-1)?.args).toEqual(["rm", "--force", "--volumes", container]);
  const receipt = JSON.parse(readFileSync(path.join(root, "backup/data-change-acceptance", runId, "receipt.json"), "utf8"));
  expect(receipt.status).toBe("NOT_COMPLETED");
});

it("stops before schema/tests when Docker is inaccessible", async () =>
{
  const { root, calls, executeCommand } = fixture("docker");
  await expect(runIntegrationAcceptance({ root, runId, executeCommand, log: () => {}, environment: {} })).rejects.toThrow("Docker access");
  expect(calls.some(call => call.args[0] === "create" || call.args.includes("db"))).toBe(false);
  const receipt = JSON.parse(readFileSync(path.join(root, "backup/data-change-acceptance", runId, "receipt.json"), "utf8"));
  expect(receipt).toMatchObject({ status: "NOT_COMPLETED", stage: "docker-access" });
});

it("rejects remote TCP and named-pipe Docker endpoints before engine operations", async () =>
{
  const { root, calls, executeCommand } = fixture();
  for (const host of ["tcp://remote:2375", "npipe:////remote/pipe/docker_engine"])
  {
    await expect(runIntegrationAcceptance({ root, runId, executeCommand, log: () => {}, environment: { DOCKER_HOST: host } })).rejects.toThrow("local Docker");
    await expect(runIntegrationAcceptance({ root, runId, executeCommand: async () => ({ code: 0, stdout: JSON.stringify(host), stderr: "" }), log: () => {}, environment: {} })).rejects.toThrow("context is not a local");
  }
  expect(calls).toEqual([]);
});

it("refuses to delete a container whose ownership does not match", async () =>
{
  const { root, calls, executeCommand } = fixture("ownership");
  await expect(runIntegrationAcceptance({ root, runId, executeCommand, log: () => {}, environment: {} })).rejects.toThrow("ownership changed");
  expect(calls.some(call => call.args[0] === "rm")).toBe(false);
});
