import { describe, expect, it } from "vitest";
import { buildRequirementSearchPipeline } from "@/persistence/requirementSearchPipeline";

/**
 * The expected condition for one ranked target. Since Wave 7.7 a ranked filter
 * matches the target either directly or inside an `anyOf`, so it is an `$or` of
 * two `$elemMatch`es rather than a single one. Built by a helper so the shape
 * lives in one place instead of being spelled out in every assertion.
 */
function rankedCondition(group: string, targetKey: string, maxValue: number)
{
  const target = { kind: "ranked", group, targetKey, value: { $lte: maxValue } };
  return {
    $or: [
      { structuredRequirements: { $elemMatch: target } },
      { structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: target } } } },
    ],
  };
}

/** Free text can sit directly in the array or as one option of an alternative. */
function textCondition(fragment: string)
{
  const target = { kind: "rankless", text: { $regex: fragment, $options: "i" } };
  return {
    $or: [
      { structuredRequirements: { $elemMatch: target } },
      { structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: target } } } },
    ],
  };
}

describe("buildRequirementSearchPipeline", () => {
  it("emits a single $match with only the requirement condition when no other filters", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [{ kind: "ranked", group: "characteristics", targetKey: "strength", maxValue: 3 }],
    });

    expect(pipeline).toEqual([{ $match: rankedCondition("characteristics", "strength", 3) }]);
  });

  it("translates name/grade/tags/exclude into a combined $and", () => {
    const pipeline = buildRequirementSearchPipeline({
      search: { name: "cios", grade: 2, tags: ["ogień", "tarcza"] },
      exclude: { tags: ["lód"] },
      requirementFilters: [{ kind: "ranked", group: "maneuvers", targetKey: "Cios", maxValue: 5 }],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(5);
    expect(and).toContainEqual({ name: { $regex: "cios", $options: "i" } });
    expect(and).toContainEqual({ grade: 2 });
    expect(and).toContainEqual({ tags: { $all: ["ogień", "tarcza"] } });
    expect(and).toContainEqual({ tags: { $nin: ["lód"] } });
    expect(and).toContainEqual(rankedCondition("maneuvers", "Cios", 5));
  });

  it("maps id→_id in sort and paginates with skip/limit", () => {
    const pipeline = buildRequirementSearchPipeline({
      sort: [{ name: "asc" }, { grade: "desc" }, { id: "asc" }],
      offset: { pageNumber: 2, pageSize: 20 },
      requirementFilters: [{ kind: "ranked", group: "attributes", targetKey: "fencing", maxValue: 4 }],
    });

    expect(pipeline).toContainEqual({ $sort: { name: 1, grade: -1, _id: 1 } });
    expect(pipeline).toContainEqual({ $skip: 20 });
    expect(pipeline).toContainEqual({ $limit: 20 });
  });

  it("omits $skip on the first page", () => {
    const pipeline = buildRequirementSearchPipeline({
      offset: { pageNumber: 1, pageSize: 10 },
      requirementFilters: [{ kind: "ranked", group: "perks", targetKey: "Twardziel", maxValue: 1 }],
    });

    expect(pipeline.some((stage) => "$skip" in stage)).toBe(false);
    expect(pipeline).toContainEqual({ $limit: 10 });
  });

  it("escapes regex special characters in name search", () => {
    const pipeline = buildRequirementSearchPipeline({
      search: { name: "a.b*c" },
      requirementFilters: [{ kind: "ranked", group: "stances", targetKey: "X", maxValue: 1 }],
    });

    // Name + the always-present requirement elemMatch => two conditions under $and.
    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toContainEqual({ name: { $regex: "a\\.b\\*c", $options: "i" } });
  });

  it("matches free-text against the rankless structured requirements (normalized fragment)", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [{ kind: "text", text: "Lekka zbroja" }],
    });

    expect(pipeline).toEqual([{ $match: textCondition("lekka zbroja") }]);
  });

  it("normalizes + escapes regex in the text-mode requirement match", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [{ kind: "text", text: "Zbroja  (ciężka)" }],
    });

    expect(pipeline[0].$match).toEqual(textCondition("zbroja \\(ciężka\\)"));
  });

  // --- Wave 6.2: several filters at once, AND-ed ---------------------------

  it("ANDs two ranked filters on different targets", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [
        { kind: "ranked", group: "characteristics", targetKey: "strength", maxValue: 3 },
        { kind: "ranked", group: "attributes", targetKey: "fencing", maxValue: 2 },
      ],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(2);
    expect(and).toContainEqual(rankedCondition("characteristics", "strength", 3));
    expect(and).toContainEqual(rankedCondition("attributes", "fencing", 2));
  });

  it("keeps two filters on the SAME target in separate conditions", () => {
    // Folding them into one $elemMatch would demand a single array entry satisfy
    // both bounds; as separate conditions they may be matched by different
    // entries, which is what "spełnia oba wymagania" means.
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [
        { kind: "ranked", group: "characteristics", targetKey: "strength", maxValue: 1 },
        { kind: "ranked", group: "characteristics", targetKey: "strength", maxValue: 4 },
      ],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(2);
    expect(and[0]).not.toBe(and[1]);
    expect(and).toContainEqual(rankedCondition("characteristics", "strength", 1));
    expect(and).toContainEqual(rankedCondition("characteristics", "strength", 4));
  });

  it("mixes a ranked and a text filter", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [
        { kind: "ranked", group: "perks", targetKey: "Twardziel", maxValue: 2 },
        { kind: "text", text: "Lekka zbroja" },
      ],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(2);
    expect(and).toContainEqual(rankedCondition("perks", "Twardziel", 2));
    expect(and).toContainEqual(textCondition("lekka zbroja"));
  });

  it("combines several requirement filters with the ordinary search conditions", () => {
    const pipeline = buildRequirementSearchPipeline({
      search: { name: "cios" },
      requirementFilters: [
        { kind: "ranked", group: "characteristics", targetKey: "strength", maxValue: 3 },
        { kind: "text", text: "Lekka zbroja" },
      ],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(3);
  });

  // --- Wave 7.7: alternatives must not fall out of the filter ---------------

  it("matches a ranked target directly OR inside an anyOf", () => {
    // Without the second branch every entity whose requirement is an
    // alternative would silently vanish from the results.
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [{ kind: "ranked", group: "powers", targetKey: "wiez", maxValue: 2 }],
    });

    const target = { kind: "ranked", group: "powers", targetKey: "wiez", value: { $lte: 2 } };
    const or = (pipeline[0].$match as { $or: Record<string, unknown>[] }).$or;
    expect(or).toHaveLength(2);
    expect(or).toContainEqual({ structuredRequirements: { $elemMatch: target } });
    expect(or).toContainEqual({ structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: target } } } });
  });

  it("finds free text inside an alternative too — „Lekka lub średnia zbroja\"", () => {
    // Both sides of that requirement are free text, so the whole thing is an
    // `anyOf` of two `rankless` options; searching only the top level would miss it.
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [{ kind: "text", text: "Lekka zbroja" }],
    });

    const or = (pipeline[0].$match as { $or: Record<string, unknown>[] }).$or;
    expect(or).toHaveLength(2);
    expect(or[1]).toEqual({
      structuredRequirements: {
        $elemMatch: { kind: "anyOf", options: { $elemMatch: { kind: "rankless", text: { $regex: "lekka zbroja", $options: "i" } } } },
      },
    });
  });

  it("keeps AND-ing several filters now that each one is an $or", () => {
    const pipeline = buildRequirementSearchPipeline({
      requirementFilters: [
        { kind: "ranked", group: "talents", targetKey: "skradanie", maxValue: 3 },
        { kind: "text", text: "zbroja" },
      ],
    });

    const and = (pipeline[0].$match as { $and: Record<string, unknown>[] }).$and;
    expect(and).toHaveLength(2);
    expect(and[0]).toHaveProperty("$or");
  });

  it("degrades to a match-everything stage rather than an illegal empty $and", () => {
    // Mongo rejects `{ $and: [] }`. `searchEntity` never takes this path without
    // a filter, but the builder must not produce a query that throws.
    const pipeline = buildRequirementSearchPipeline({ requirementFilters: [] });

    expect(pipeline).toEqual([{ $match: {} }]);
  });
});

describe("optional and scalar search conditions", () => {
  it("leaves the query unrestricted when include and exclude values are empty", () => {
    const empty = { a: undefined, b: "  ", c: [], d: { anyOf: [] } };
    expect(buildRequirementSearchPipeline({ search: empty, exclude: empty, requirementFilters: [] })).toEqual([{ $match: {} }]);
  });

  it("escapes excluded names and uses zero and false as filter values", () => {
    expect(buildRequirementSearchPipeline({
      search: { id: { anyOf: ["a", "b"] }, available: false },
      exclude: { name: "Test (A)", grade: 0, tags: { anyOf: ["wycofany"] }, enabled: false },
      requirementFilters: [],
      extraConditions: [{ faction: "straż" }],
    })).toEqual([{ $match: { $and: [
      { _id: { $in: ["a", "b"] } }, { available: false },
      { name: { $not: { $regex: "Test \\(A\\)", $options: "i" } } }, { grade: { $ne: 0 } },
      { tags: { $nin: ["wycofany"] } }, { enabled: { $ne: false } }, { faction: "straż" },
    ] } }]);
  });
});
