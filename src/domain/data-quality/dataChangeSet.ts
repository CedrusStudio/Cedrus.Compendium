import { createHash } from "node:crypto";
import { z } from "zod";
import { effectsAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";

export const DATA_CHANGE_BATCH_LIMIT = 20;
export const contentCollections = ["Maneuver", "Stance", "State"] as const;
export type ContentCollection = typeof contentCollections[number];
const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const revisionSchema = z.string().regex(/^[a-f0-9]{40}$/);
const text = z.string().trim().min(1);
type JsonValue = z.infer<ReturnType<typeof z.json>>;
const jsonObject = z.record(z.string(), z.json());

export const reviewedContentSchema = z.strictObject({
  description: z.string(),
  effects: z.json(),
  simulatable: z.boolean().nullable(),
  unsupportedReason: z.string().nullable(),
});
export type ReviewedContent = z.infer<typeof reviewedContentSchema>;

const proposalSchema = z.strictObject({
  description: z.string().min(1).max(1000).optional(),
  effects: z.json().optional(),
  simulatable: z.boolean().nullable().optional(),
  unsupportedReason: z.string().max(500).nullable().optional(),
}).refine(value => Object.keys(value).length > 0, "A nonempty proposed patch is required.");

const approvalSchema = z.strictObject({
  reviewer: z.string(),
  decision: z.enum(["pending", "approved", "rejected"]),
  evidence: z.string(),
});

export const dataChangeSetSchema = z.strictObject({
  schemaVersion: z.literal(1),
  batchId: text.max(100),
  source: z.strictObject({ exportCreatedAt: z.iso.datetime(), sourceRevision: revisionSchema }),
  rows: z.array(z.strictObject({
    reviewId: text.max(100),
    collection: z.enum(contentCollections),
    id: z.ulid(),
    identityAssertions: z.strictObject({ name: text, grade: z.number().int().min(0).max(20) }),
    expectedHash: hashSchema,
    context: jsonObject,
    before: reviewedContentSchema,
    proposed: proposalSchema,
    changeKind: z.enum(["editorial", "mapping"]),
    reviewState: z.enum(["unassessed", "needs-decision", "ready", "unsupported", "applied", "rejected"]),
    issues: z.array(z.strictObject({ code: text, path: z.string(), severity: z.enum(["warning", "blocker"]), evidence: text, resolution: z.string().nullable() })),
    mechanics: z.strictObject({ summary: text, unknowns: z.array(text) }),
    review: z.strictObject({ content: approvalSchema, application: approvalSchema, acceptedRule: z.string() }),
    verification: z.strictObject({
      schemaRevision: revisionSchema,
      engineRevision: revisionSchema,
      checks: z.array(z.strictObject({ name: text, kind: z.enum(["schema", "engine"]), result: z.enum(["PASS", "FAIL", "NOT_RUN"]), evidence: z.string() })),
    }),
  })).min(1).max(DATA_CHANGE_BATCH_LIMIT),
}).superRefine((batch, ctx) =>
{
  const targets = new Set<string>();
  const reviewIds = new Set<string>();
  batch.rows.forEach((row, index) =>
  {
    const target = `${row.collection}/${row.id}`;
    if (targets.has(target)) ctx.addIssue({ code: "custom", path: ["rows", index, "id"], message: "Duplicate target." });
    if (reviewIds.has(row.reviewId)) ctx.addIssue({ code: "custom", path: ["rows", index, "reviewId"], message: "Duplicate review ID." });
    targets.add(target);
    reviewIds.add(row.reviewId);
  });
});

export type DataChangeSet = z.infer<typeof dataChangeSetSchema>;
export type DataChangeRow = DataChangeSet["rows"][number];

/** Stable JSON hashing: object key order is irrelevant; array order is retained. */
export function canonicalJson(value: unknown): string
{
  const ancestors = new Set<object>();
  function encode(item: unknown): string
  {
    if (item === null || typeof item === "string" || typeof item === "boolean") return JSON.stringify(item);
    if (typeof item === "number" && Number.isFinite(item)) return JSON.stringify(item);
    if (typeof item !== "object" || item === null) throw new DataChangeInputError("Only finite JSON values can be hashed.");
    if (ancestors.has(item)) throw new DataChangeInputError("Cyclic values cannot be hashed.");
    const prototype = Object.getPrototypeOf(item);
    if (!Array.isArray(item) && prototype !== Object.prototype && prototype !== null) throw new DataChangeInputError("Expected a plain JSON object.");
    ancestors.add(item);
    try
    {
      if (Array.isArray(item)) return `[${Array.from(item, encode).join(",")}]`;
      const record = item as Record<string, unknown>;
      return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${encode(record[key])}`).join(",")}}`;
    }
    finally { ancestors.delete(item); }
  }
  return encode(value);
}

export const contentHash = (value: unknown): string => createHash("sha256").update(canonicalJson(value)).digest("hex");

// Relations to characters are not game rules and must not enter review bundles.
// Missing optional Prisma values and explicit null normalize to the same read
// contract. Rollback restores those values, not raw BSON field absence.
const contextKeys = ["name", "grade", "price", "tags", "structuredRequirements", "replaces", "castTime", "cooldown"] as const;
export function reviewSnapshot(record: Record<string, unknown>)
{
  const rawContent = {
    description: record.description,
    effects: record.effects ?? null,
    simulatable: record.simulatable ?? null,
    unsupportedReason: record.unsupportedReason ?? null,
  };
  const rawContext = Object.fromEntries(contextKeys.map(key => [key, record[key] ?? null]));
  const content = reviewedContentSchema.parse(rawContent);
  const context = jsonObject.parse(rawContext);
  if (canonicalJson(rawContent) !== canonicalJson(content) || canonicalJson(rawContext) !== canonicalJson(context)) throw new DataChangeInputError("Structural validation would discard source content.");
  return { content, context, hash: contentHash({ content, context }) };
}

export type PreparedRow = DataChangeRow & { after: ReviewedContent; afterHash: string; patch: DataChangeRow["proposed"] };
export type PreparedChangeSet = { batch: DataChangeSet; batchHash: string; rows: PreparedRow[] };

export class DataChangeBlockedError extends Error
{
  constructor(public readonly issues: string[])
  {
    super(issues.join("\n"));
    this.name = "DataChangeBlockedError";
  }
}

export class DataChangeInputError extends Error {}

/** No I/O: validate the entire review before permitting a database operation. */
export function prepareDataChangeSet(input: unknown): PreparedChangeSet
{
  const batch = dataChangeSetSchema.parse(input);
  const issues: string[] = [];
  const rows = batch.rows.map(row =>
  {
    const block = (message: string) => issues.push(`${row.reviewId}: ${message}`);
    if (row.reviewState !== "ready" && row.reviewState !== "unsupported") block("Review is not ready.");
    if (row.issues.some(issue => issue.severity === "blocker" && !issue.resolution?.trim())) block("Unresolved blocker.");
    if (row.mechanics.unknowns.length > 0) block("Unresolved rule questions.");
    for (const approval of [row.review.content, row.review.application])
    {
      if (approval.decision !== "approved" || !approval.reviewer.trim() || !approval.evidence.trim()) block("Both reviews require approval and evidence.");
    }
    if (!row.review.acceptedRule.trim()) block("Accepted rule reference is required.");
    for (const kind of row.changeKind === "mapping" ? ["schema", "engine"] : ["schema"])
    {
      if (!row.verification.checks.some(check => check.kind === kind && check.result === "PASS" && check.evidence.trim())) block(`Missing passing ${kind} check.`);
    }
    if (row.verification.checks.some(check => check.result !== "PASS")) block("Required checks are incomplete or failed.");
    if (row.context.name !== row.identityAssertions.name || row.context.grade !== row.identityAssertions.grade) block("Identity assertions differ from reviewed context.");
    if (contentHash({ content: row.before, context: row.context }) !== row.expectedHash) block("Expected hash does not match the reviewed before values.");

    const patch = { ...row.proposed };
    if (row.changeKind === "editorial")
    {
      if (Object.keys(patch).some(key => key !== "description")) block("Editorial changes may only update description.");
      if (row.reviewState !== "ready") block("Editorial changes require ready state.");
    }
    else
    {
      const parsed = effectsAuthoringSchema.safeParse(patch.effects);
      if (!parsed.success) parsed.error.issues.forEach(issue => block(`effects.${issue.path.join(".")}: ${issue.message}`));
      else patch.effects = parsed.data as JsonValue;
      if (row.reviewState === "ready" && (patch.simulatable !== true || patch.unsupportedReason !== null || !parsed.success || parsed.data.length === 0)) block("Supported mapping requires complete effects, simulatable=true and no unsupported reason.");
      if (row.reviewState === "unsupported" && (patch.simulatable !== false || !patch.unsupportedReason?.trim() || !parsed.success || parsed.data.length !== 0)) block("Unsupported mapping requires empty effects, simulatable=false and a precise reason.");
    }
    const after = reviewedContentSchema.parse({ ...row.before, ...patch });
    const afterHash = contentHash({ content: after, context: row.context });
    if (afterHash === row.expectedHash) block("Proposal makes no change.");
    return { ...row, patch, after, afterHash };
  });
  if (issues.length > 0) throw new DataChangeBlockedError(issues);
  // Bind journal identity to the reviewed input AND current parsed output.
  return { batch, rows, batchHash: contentHash({ batch, after: rows.map(row => row.after) }) };
}
