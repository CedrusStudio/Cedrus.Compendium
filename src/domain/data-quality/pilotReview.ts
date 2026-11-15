import { canonicalJson, dataChangeSetSchema, reviewSnapshot, type ContentCollection, type DataChangeRow, type DataChangeSet } from "./dataChangeSet";
import { effectsAuthoringSchema } from "@/domain/combat-lab/effects/effectAuthoringSchema";

/** Candidate rules only. No generated row is approved for application. */
function candidate(collection: ContentCollection, record: Record<string, unknown>)
{
  const grade = Number(record.grade);
  const name = record.name;
  if (collection === "Maneuver" && name === "Koci Instynkt" && [1, 2, 3].includes(grade))
  {
    return {
      proposed: { description: `Zwiększa niewrażliwość o 1 i odporność o ${grade}.`, effects: [{ type: "stat", mode: "self", duration: 1, immunity: 1, resistance: grade }], simulatable: true, unsupportedReason: null },
      summary: "Candidate adds the resistance stated in each rank; duration 1 is observed data, not an accepted rule.",
      unknowns: ["Define when the instantaneous bonus starts, when it expires and how reuse refreshes it; the stored duration 1 is not an accepted rule. Immunity 1 and resistance 1/2/3 are already stated in the source."],
      code: "DQ-SEMANTICS",
    };
  }
  if (collection === "Maneuver" && name === "Stadne Wycie" && [1, 2, 3].includes(grade))
  {
    return {
      proposed: { effects: [], simulatable: false, unsupportedReason: "Silnik nie odwzorowuje pełnego działania na stado. Czas działania i wspólny limit użyć wymagają rozstrzygnięcia." },
      summary: "Candidate explicitly withdraws the self-only approximation; original effects are retained in before values.",
      unknowns: ["Approve withdrawal of the incomplete mapping.", "Define group targets, duration, who shares the once-per-round limit and its relation to cooldown 5."],
      code: "DQ-SUPPORT",
    };
  }
  if (collection === "Stance" && name === "Postawa Defensywna")
  {
    const match = /^Zwiększa odporność o (\d+), zmniejsza obrażenia o (\d+)\.$/.exec(String(record.description));
    if (!match) throw new Error("Pilot source wording changed; review the candidate rule.");
    return {
      proposed: { effects: [{ type: "stat", mode: "self", duration: 0, resistance: Number(match[1]), damage: -Number(match[2]) }], simulatable: true, unsupportedReason: null },
      summary: "Candidate preserves each rank's nonlinear numbers. Duration 0 is refreshed on the owner's turn by the current engine; it does not establish the intended mode lifetime.",
      unknowns: [
        "Resolve rulebook round-start activation versus engine own-turn activation/pre-or-post-attack changes, including protection before the first own turn.",
        "Decide whether a replaced stance's modifiers expire immediately or remain until the next own turn, potentially overlapping the new stance.",
        "Define whether the damage penalty applies to offense attacks/spells only or also direct maneuver damage, and how multiple damage components count.",
      ], code: "DQ-SEMANTICS",
    };
  }
  if (collection === "State" && name === "Ostrość Umysłu")
  {
    if (record.description !== "Dodaje +2 do obrażeń.") throw new Error("Pilot source wording changed; review the candidate rule.");
    return {
      proposed: { description: "Zwiększa obrażenia o 2.", effects: [{ type: "stat", mode: "self", duration: 0, damage: 2 }], simulatable: true, unsupportedReason: null },
      summary: "Candidate maps the stated +2 damage during the active state; it adds no automatic Strength-derived damage.",
      unknowns: [
        "Resolve rulebook round-start state activation versus the engine's own-turn refresh and define the end of the active state.",
        "Define whether +2 damage applies to offense attacks/spells only or also direct maneuver damage, and how multiple damage components count.",
      ], code: "DQ-SEMANTICS",
    };
  }
}

export function preparePilotReview(collections: Map<string, Record<string, unknown>[]>, source: DataChangeSet["source"]): DataChangeSet
{
  const rows: DataChangeRow[] = [];
  for (const collection of ["Maneuver", "Stance", "State"] as const)
  {
    for (const record of collections.get(collection) ?? [])
    {
      const proposal = candidate(collection, record);
      if (!proposal) continue;
      // Catch rank-family content changes rather than silently reusing an old
      // proposal against a new source with different mechanical meaning.
      if (collection === "Maneuver")
      {
        const grade = Number(record.grade);
        const expected = record.name === "Koci Instynkt"
          ? `Dodaje 1 niewrażliwości${grade === 1 ? "" : " i"} ${grade} odporności.`
          : `Dodaje 1 odporności${grade === 1 ? "" : ` i ${grade - 1} redukcji`} każdemu ze stada. Tylko jedno na rundę.`;
        const effects = record.name === "Koci Instynkt"
          ? [{ type: "stat", mode: "self", duration: 1, immunity: 1 }]
          : [{ type: "stat", mode: "self", duration: 1, resistance: 1 }];
        if (record.description !== expected || canonicalJson(record.effects) !== canonicalJson(effects) || record.simulatable !== true) throw new Error("Pilot source mapping changed; review the proposal.");
      }
      if (collection !== "Maneuver" && (record.effects != null || record.simulatable != null)) throw new Error("Pilot source mode is already assessed; review it separately.");
      const snapshot = reviewSnapshot(record);
      effectsAuthoringSchema.parse(proposal.proposed.effects);
      rows.push({
        reviewId: `${collection}-${record.id}`,
        collection, id: String(record.id), identityAssertions: { name: String(record.name), grade: Number(record.grade) },
        expectedHash: snapshot.hash, before: snapshot.content, context: snapshot.context,
        proposed: proposal.proposed,
        changeKind: "mapping", reviewState: proposal.unknowns.length > 0 ? "needs-decision" : "unassessed",
        issues: [{ code: proposal.code, path: "effects", severity: "blocker", evidence: proposal.summary, resolution: null }],
        mechanics: { summary: proposal.summary, unknowns: proposal.unknowns },
        review: { content: { reviewer: "", decision: "pending", evidence: "" }, application: { reviewer: "", decision: "pending", evidence: "" }, acceptedRule: "" },
        verification: { schemaRevision: source.sourceRevision, engineRevision: source.sourceRevision, checks: [
          { name: "strict authoring parser", kind: "schema", result: "PASS", evidence: "Generated candidate parsed with effectsAuthoringSchema." },
          { name: "per-rank lifecycle and semantic fixture", kind: "engine", result: "NOT_RUN", evidence: "" },
        ] },
      });
    }
  }
  for (const [collection, name, expected] of [
    ["Maneuver", "Koci Instynkt", [1, 2, 3]], ["Maneuver", "Stadne Wycie", [1, 2, 3]],
    ["Stance", "Postawa Defensywna", [1, 2, 3, 4, 5, 6]], ["State", "Ostrość Umysłu", [1]],
  ] as const)
  {
    const grades = rows.filter(row => row.collection === collection && row.identityAssertions.name === name).map(row => row.identityAssertions.grade).sort((a, b) => a - b);
    if (canonicalJson(grades) !== canonicalJson(expected)) throw new Error("Pilot family inventory changed; review all ranks together.");
  }
  rows.sort((left, right) => left.collection.localeCompare(right.collection) || left.identityAssertions.name.localeCompare(right.identityAssertions.name) || left.identityAssertions.grade - right.identityAssertions.grade);
  return dataChangeSetSchema.parse({ schemaVersion: 1, batchId: `pilot-${source.exportCreatedAt}`, source, rows });
}
