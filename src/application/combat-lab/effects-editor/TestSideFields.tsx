"use client";

/**
 * Graphical builders for the test-based effects (Etap 2): contested test and
 * save-vs-ST. Reuses `EffectListField` / `SingleEffectField` for nested
 * onWin/onFail/perMargin effects and a shared pool builder (`TestSideFields`).
 */

import { Fragment } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { EffectField, EffectListField, SingleEffectField } from "@/application/combat-lab/effects-editor/EffectListField";
import { SKILLS } from "@/application/combat-lab/effects-editor/effectFieldsMeta";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";

function SkillSelect({ name }: { name: string })
{
  const { control, setValue } = useFormContext();
  const ref = (useWatch({ control, name }) ?? { group: "attributes", key: "fencing" }) as { group: string; key: string };
  return (
    <Select value={`${ref.group}:${ref.key}`} onValueChange={(v) => { const [g, k] = v.split(":"); setValue(name, { group: g, key: k }, { shouldDirty: true }); }}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {SKILLS.map(([g, k, pl]) => <SelectItem key={`${g}:${k}`} value={`${g}:${k}`}>{pl}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function PoolTermField({ name, onRemove, canRemove }: { name: string; onRemove: () => void; canRemove: boolean })
{
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: `${name}.anyOf` });
  return (
    <div className="flex flex-wrap items-center gap-1">
      {fields.map((f, i) => (
        <Fragment key={f.id}>
          {i > 0 && <span className="text-muted-foreground">/</span>}
          <SkillSelect name={`${name}.anyOf.${i}`} />
          {fields.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>✕</Button>}
        </Fragment>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => append({ group: "attributes", key: "reflex" })}>/ alternatywa</Button>
      {canRemove && <Button type="button" variant="ghost" size="sm" onClick={onRemove}>usuń term</Button>}
    </div>
  );
}

function RollModField({ name }: { name: string })
{
  const { control } = useFormContext();
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">rzut</Label>
        <Select value={(field.value as string) ?? ""} onValueChange={(v) => field.onChange(v || undefined)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="zwykły" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="advantage">przewaga</SelectItem>
            <SelectItem value="disadvantage">utrudnienie</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )} />
  );
}

/** Editor for one `TestSide` object (pool of summed terms + modifiers). */
export function TestSideFields({ name, title }: { name: string; title: string })
{
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: `${name}.pool` });
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="mb-1 text-xs font-medium">{title}</div>
      {fields.map((f, i) => (
        <div key={f.id} className="mt-1 flex flex-wrap items-center gap-1">
          {i > 0 && <span className="mr-1 font-semibold">+</span>}
          <PoolTermField name={`${name}.pool.${i}`} onRemove={() => remove(i)} canRemove={fields.length > 1} />
        </div>
      ))}
      <div className="mt-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ anyOf: [{ group: "attributes", key: "reflex" }] })}>+ term (do sumy)</Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        <EffectField name={`${name}.modifier`} def={{ path: "modifier", label: "modyfikator (±)", kind: "number" }} />
        <EffectField name={`${name}.dieGradeDelta`} def={{ path: "dieGradeDelta", label: "zmiana rangi kości", kind: "number" }} />
        <RollModField name={`${name}.rollMod`} />
      </div>
    </div>
  );
}

/** Optional `{ per, effect, cap }` scaling block (contested.perMargin / save.perMarginOfFailure). */
function PerMarginField({ name, present, label, depth }: { name: string; present: boolean; label: string; depth: number })
{
  const { setValue } = useFormContext();
  const toggle = (on: boolean) => setValue(name, on
    ? { per: 1, effect: { type: "damage", damage: { amount: 0, grade: 0, bonus: 1 }, damageType: "zwyczajne" } }
    : undefined, { shouldDirty: true, shouldValidate: true });
  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={present} onCheckedChange={(c) => toggle(c === true)} /> skalowanie: {label}
      </label>
      {present && (
        <div className="mt-1 flex flex-col gap-2">
          <div className="flex flex-wrap gap-3">
            <EffectField name={`${name}.per`} def={{ path: "per", label: "na ile oczek (per)", kind: "number", def: 1 }} />
            <EffectField name={`${name}.cap`} def={{ path: "cap", label: "limit (opc.)", kind: "number" }} />
          </div>
          <div className="border-l pl-3"><SingleEffectField name={`${name}.effect`} depth={depth + 1} /></div>
        </div>
      )}
    </div>
  );
}

export function ContestedEffectFields({ name, depth }: { name: string; depth: number })
{
  const { control, setValue } = useFormContext();
  const onWinTarget = (useWatch({ control, name: `${name}.onWinTarget` }) as string) ?? "target";
  const perMargin = useWatch({ control, name: `${name}.perMargin` });
  return (
    <div className="mt-3 flex flex-col gap-2">
      <TestSideFields name={`${name}.attacker`} title="Atakujący (pula)" />
      <TestSideFields name={`${name}.defender`} title="Obrońca (pula)" />
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">efekty przy wygranej działają na</Label>
        <Select value={onWinTarget} onValueChange={(v) => setValue(`${name}.onWinTarget`, v, { shouldDirty: true })}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="target">cel (przeciwnik)</SelectItem>
            <SelectItem value="self">siebie</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Label className="text-xs text-muted-foreground">Przy wygranej (onWin):</Label>
      <div className="border-l pl-3"><EffectListField name={`${name}.onWin`} depth={depth + 1} /></div>
      <PerMarginField name={`${name}.perMargin`} present={!!perMargin} label="za każde oczko przewagi" depth={depth} />
    </div>
  );
}

export function SaveEffectFields({ name, depth }: { name: string; depth: number })
{
  const { control, setValue } = useFormContext();
  const who = (useWatch({ control, name: `${name}.who` }) as string) ?? "target";
  const pm = useWatch({ control, name: `${name}.perMarginOfFailure` });
  return (
    <div className="mt-3 flex flex-col gap-2">
      <TestSideFields name={`${name}.pool`} title="Pula testu (kto się broni)" />
      <div className="flex flex-wrap gap-3">
        <EffectField name={`${name}.st`} def={{ path: "st", label: "ST (próg)", kind: "number", def: 7 }} />
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">kto rzuca</Label>
          <Select value={who} onValueChange={(v) => setValue(`${name}.who`, v, { shouldDirty: true })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="target">cel (przeciwnik)</SelectItem>
              <SelectItem value="self">atakujący</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Label className="text-xs text-muted-foreground">Przy porażce (onFail):</Label>
      <div className="border-l pl-3"><EffectListField name={`${name}.onFail`} depth={depth + 1} /></div>
      <PerMarginField name={`${name}.perMarginOfFailure`} present={!!pm} label="za każde oczko porażki" depth={depth} />
    </div>
  );
}
