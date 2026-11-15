import { z } from "zod";
import type { Effect } from "@/domain/combat-lab/effects/Effect";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";
import { BUILTIN_PLUGINS } from "@/domain/combat-lab/plugins/builtinPlugins";
import { getEffectPlugin } from "@/domain/combat-lab/plugins/registry";

type Path = (string | number)[];

function isRecord(value: unknown): value is Record<string, unknown>
{
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reject keys stripped by the compatibility parser, at every nesting level. */
function checkRetainedFields(input: unknown, output: unknown, ctx: z.RefinementCtx, path: Path): void
{
  if (Array.isArray(input) && Array.isArray(output))
  {
    input.forEach((value, index) => checkRetainedFields(value, output[index], ctx, [...path, index]));
    return;
  }

  if (!isRecord(input) || !isRecord(output)) return;

  for (const key of Object.keys(input))
  {
    if (!Object.prototype.hasOwnProperty.call(output, key))
    {
      ctx.addIssue({ code: "custom", path: [...path, key], message: "Unknown effect field." });
      continue;
    }

    checkRetainedFields(input[key], output[key], ctx, [...path, key]);
  }
}

/** Legacy aliases are supported for reads, but must be explicit in new writes. */
function checkResourceAliases(input: unknown, output: unknown, ctx: z.RefinementCtx, path: Path): void
{
  if (input === "mana" && output === "essence")
  {
    ctx.addIssue({ code: "custom", path, message: 'Use "essence"; legacy "mana" is read-only.' });
    return;
  }

  if (Array.isArray(input) && Array.isArray(output))
  {
    input.forEach((value, index) => checkResourceAliases(value, output[index], ctx, [...path, index]));
    return;
  }

  if (!isRecord(input) || !isRecord(output)) return;

  for (const key of Object.keys(input))
  {
    checkResourceAliases(input[key], output[key], ctx, [...path, key]);
  }
}

function validatePlugins(effect: Effect, ctx: z.RefinementCtx, path: Path): void
{
  if (effect.type === "custom")
  {
    // Built-ins are available in importers as well as the browser, without
    // requiring an application-startup side effect on the global registry.
    const plugin = getEffectPlugin(effect.effectType)
      ?? BUILTIN_PLUGINS.flatMap(pack => pack.effects ?? []).find(item => item.effectType === effect.effectType);

    if (!plugin?.schema)
    {
      ctx.addIssue({ code: "custom", path: [...path, "effectType"], message: "An effect plugin with a validation schema is required." });
      return;
    }

    const parsed = plugin.schema.safeParse(effect.data);
    if (!parsed.success)
    {
      parsed.error.issues.forEach(issue => ctx.addIssue({ ...issue, path: [...path, "data", ...issue.path] }));
      return;
    }

    if (!isRecord(parsed.data))
    {
      ctx.addIssue({ code: "custom", path: [...path, "data"], message: "Plugin data must be an object." });
      return;
    }

    checkRetainedFields(effect.data, parsed.data, ctx, [...path, "data"]);
    effect.data = parsed.data;
    return;
  }

  const visitList = (list: Effect[], key: string) => list.forEach((child, index) => validatePlugins(child, ctx, [...path, key, index]));

  switch (effect.type)
  {
    case "chance":
    case "when":
      visitList(effect.then, "then");
      return;
    case "scale":
      validatePlugins(effect.effect, ctx, [...path, "effect"]);
      return;
    case "contested":
      visitList(effect.onWin, "onWin");
      if (effect.perMargin) validatePlugins(effect.perMargin.effect, ctx, [...path, "perMargin", "effect"]);
      return;
    case "save":
      visitList(effect.onFail, "onFail");
      if (effect.perMarginOfFailure) validatePlugins(effect.perMarginOfFailure.effect, ctx, [...path, "perMarginOfFailure", "effect"]);
  }
}

/** Write boundary shared by the compendium editor, API and effect importers.
 * Keep effectSchema as the separate, backward-compatible read boundary.
 * Persist this parser's output, including any plugin defaults/transforms.
 */
export const effectAuthoringSchema: z.ZodType<Effect> = z.unknown().transform((input, ctx) =>
{
  const parsed = effectSchema.safeParse(input);
  if (!parsed.success)
  {
    parsed.error.issues.forEach(issue => ctx.addIssue({ ...issue }));
    return z.NEVER;
  }

  checkRetainedFields(input, parsed.data, ctx, []);
  checkResourceAliases(input, parsed.data, ctx, []);
  validatePlugins(parsed.data, ctx, []);
  return parsed.data;
});

export const effectsAuthoringSchema = z.array(effectAuthoringSchema);
