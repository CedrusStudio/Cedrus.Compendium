"use client";

/**
 * Recursive editor for an `Effect[]` living at a form path (e.g. "effects",
 * "effects.0.then", "effects.1.onWin"). Renders each effect as a type-select +
 * body; nested lists (when/chance/scale `then`/`effect`) recurse through the
 * same component. Simple types are field-driven via `EFFECT_TYPE_META`;
 * contested/save/when/scale/chance have dedicated field-driven builders below
 * (`ContestedEffectFields`, `SaveEffectFields`, `ScaleFields`, ...). Only
 * `custom` (the plugin escape hatch) is intentionally raw JSON — its shape is
 * defined by whichever plugin owns `effectType`, not by this app.
 */

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  EFFECT_TYPE_META, EFFECT_TYPE_ORDER, defaultEffect, weaponDiceDamageScalePreset,
  ATTACK_KINDS, ATTACK_KIND_LABELS, CONDITION_KINDS, CONDITION_LABELS, STATUS_IDS,
  RESOURCE_POOL_KINDS, RESOURCE_POOL_LABELS, SCALE_SOURCE_KINDS, SCALE_SOURCE_LABELS, SKILLS,
  type FieldDef, type LooseEffect,
} from "@/application/combat-lab/effects-editor/effectFieldsMeta";
import { statusLabelsPl } from "@/domain/combat-lab/i18n/labels";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";
import { ContestedEffectFields, SaveEffectFields } from "@/application/combat-lab/effects-editor/TestSideFields";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select";
import { Checkbox } from "@/common/components/ui/checkbox";

export function EffectListField({ name, depth = 0 }: { name: string; depth?: number })
{
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">Brak efektów.</p>}
      {fields.map((f, i) => (
        <EffectItem key={f.id} name={`${name}.${i}`} onRemove={() => remove(i)} depth={depth} />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => append(defaultEffect("damage"))}>+ Dodaj efekt</Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(weaponDiceDamageScalePreset())}
          title='Skalowanie: "za każdą kość broni" + 1 obrażenie na kość, gotowe do edycji'
        >
          + Obrażenie za kość broni (+1/kość)
        </Button>
      </div>
    </div>
  );
}

export function SingleEffectField({ name, depth = 0 }: { name: string; depth?: number })
{
  return <EffectItem name={name} depth={depth} />;
}

function EffectItem({ name, onRemove, depth }: { name: string; onRemove?: () => void; depth: number })
{
  const { control, setValue } = useFormContext();
  const eff = (useWatch({ control, name }) ?? {}) as LooseEffect;
  const type = (eff.type as string) ?? "damage";
  const meta = EFFECT_TYPE_META[type];

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(t) => setValue(name, defaultEffect(t), { shouldDirty: true, shouldValidate: true })}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EFFECT_TYPE_ORDER.map(t => <SelectItem key={t} value={t}>{EFFECT_TYPE_META[t]!.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {onRemove && <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onRemove}>✕</Button>}
      </div>

      {meta?.simple && meta.fields ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {meta.fields.map(f => <EffectField key={f.path} name={`${name}.${f.path}`} def={f} />)}
        </div>
      ) : type === "contested" ? (
        <ContestedEffectFields name={name} depth={depth} />
      ) : type === "save" ? (
        <SaveEffectFields name={name} depth={depth} />
      ) : type === "when" ? (
        <div className="mt-3 flex flex-col gap-2">
          <ConditionField name={`${name}.condition`} />
          <Label className="text-xs text-muted-foreground">Wtedy:</Label>
          <div className="border-l pl-3"><EffectListField name={`${name}.then`} depth={depth + 1} /></div>
        </div>
      ) : type === "scale" ? (
        <ScaleFields name={name} depth={depth} />
      ) : type === "chance" ? (
        <div className="mt-3 flex flex-col gap-2">
          <EffectField name={`${name}.chance`} def={{ path: "chance", label: "szansa (%)", kind: "number", def: 50 }} />
          <Label className="text-xs text-muted-foreground">Wtedy:</Label>
          <div className="border-l pl-3"><EffectListField name={`${name}.then`} depth={depth + 1} /></div>
        </div>
      ) : type === "custom" ? (
        <CustomEffectFields name={name} value={eff} />
      ) : (
        <RawJsonField name={name} value={eff} />
      )}
    </div>
  );
}

function CustomEffectFields({ name, value }: { name: string; value: LooseEffect })
{
  const { control, setValue } = useFormContext();
  const dataValid = value.data == null || (typeof value.data === "object" && !Array.isArray(value.data));
  return (
    <div className="mt-3 flex flex-col gap-2">
      <Controller control={control} name={`${name}.effectType`} render={({ field }) => (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">effectType (klucz pluginu)</Label>
          <Input className="w-56" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
        </div>
      )} />
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted-foreground">
          data (JSON obiektu){" "}
          <span className={dataValid ? "text-emerald-600" : "text-destructive"}>{dataValid ? "✓" : "⚠ musi być obiektem"}</span>
        </div>
        <textarea
          className="min-h-[90px] w-full rounded-md border bg-background p-2 font-mono text-xs"
          defaultValue={JSON.stringify(value.data ?? {}, null, 2)}
          onBlur={(e) => { try { setValue(`${name}.data`, JSON.parse(e.target.value), { shouldDirty: true, shouldValidate: true }); } catch { /* keep editing */ } }}
        />
      </div>
    </div>
  );
}

export function EffectField({ name, def }: { name: string; def: FieldDef })
{
  const { control } = useFormContext();

  if (def.kind === "check")
  {
    return (
      <Controller control={control} name={name} render={({ field }) => (
        <label className="mt-5 flex items-center gap-2 text-sm">
          <Checkbox checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true ? true : undefined)} />
          {def.label}
        </label>
      )} />
    );
  }
  if (def.kind === "enum")
  {
    return (
      <Controller control={control} name={name} render={({ field }) => (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">{def.label}</Label>
          <Select value={(field.value as string) ?? (def.def as string) ?? ""} onValueChange={field.onChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(def.options ?? []).map(o => <SelectItem key={o} value={o}>{def.optLabels?.[o] ?? o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )} />
    );
  }
  if (def.kind === "text")
  {
    return (
      <Controller control={control} name={name} render={({ field }) => (
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">{def.label}</Label>
          <Input className="w-56" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
        </div>
      )} />
    );
  }
  return (
    <Controller control={control} name={name} render={({ field }) => (
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">{def.label}</Label>
        <Input type="number" className="w-24" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
      </div>
    )} />
  );
}

function ScaleFields({ name, depth }: { name: string; depth: number })
{
  const { control, setValue } = useFormContext();
  const source = (useWatch({ control, name: `${name}.source` }) ?? { kind: "opponentDice" }) as Record<string, unknown>;
  const kind = (source.kind as string) ?? "opponentDice";

  const onKind = (k: string) =>
  {
    const fresh = k === "selfResource" ? { kind: k, resource: "essence" }
      : (k === "selfStatusStacks" || k === "targetStatusStacks") ? { kind: k, status: "bleeding" }
      : (k === "selfStat" || k === "opponentStat") ? { kind: k, group: "characteristics", key: "strength" }
      : { kind: k };
    setValue(`${name}.source`, fresh, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">za każde…</Label>
          <Select value={kind} onValueChange={onKind}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{SCALE_SOURCE_KINDS.map(k => <SelectItem key={k} value={k}>{SCALE_SOURCE_LABELS[k]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {kind === "selfResource" && (
          <Controller control={control} name={`${name}.source.resource`} render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">zasób</Label>
              <Select value={(field.value as string) ?? "essence"} onValueChange={field.onChange}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_POOL_KINDS.map(r => <SelectItem key={r} value={r}>{RESOURCE_POOL_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )} />
        )}
        {(kind === "selfStatusStacks" || kind === "targetStatusStacks") && (
          <Controller control={control} name={`${name}.source.status`} render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">status</Label>
              <Select value={(field.value as string) ?? "bleeding"} onValueChange={field.onChange}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_IDS.map(s => <SelectItem key={s} value={s}>{statusLabelsPl[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )} />
        )}
        {(kind === "selfStat" || kind === "opponentStat") && (
          <Controller control={control} name={`${name}.source.key`} render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">statystyka</Label>
              <Select
                value={(field.value as string) ?? "strength"}
                onValueChange={(key) => {
                  const group = SKILLS.find(([, k]) => k === key)?.[0] ?? "characteristics";
                  setValue(`${name}.source.group`, group, { shouldDirty: true, shouldValidate: true });
                  field.onChange(key);
                }}
              >
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{SKILLS.map(([, key, pl]) => <SelectItem key={key} value={key}>{pl}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )} />
        )}
        <EffectField name={`${name}.per`} def={{ path: "per", label: "na ile (per)", kind: "number", def: 1 }} />
        <EffectField name={`${name}.cap`} def={{ path: "cap", label: "limit (opc.)", kind: "number" }} />
      </div>
      <Label className="text-xs text-muted-foreground">Efekt (na każde):</Label>
      <div className="border-l pl-3"><SingleEffectField name={`${name}.effect`} depth={depth + 1} /></div>
    </div>
  );
}

function ConditionField({ name }: { name: string })
{
  const { control, setValue } = useFormContext();
  const cond = (useWatch({ control, name }) ?? { kind: "opponentAttackKind", value: "melee" }) as Record<string, unknown>;
  const kind = (cond.kind as string) ?? "opponentAttackKind";

  const onKind = (k: string) =>
  {
    const fresh = k === "opponentAttackKind" ? { kind: k, value: "melee" }
      : (k === "targetHasStatus" || k === "selfHasStatus") ? { kind: k, status: "bleeding" }
      : k === "hasResource" ? { kind: k, resource: "essence", min: 1 }
      : { kind: k };
    setValue(name, fresh, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">warunek</Label>
        <Select value={kind} onValueChange={onKind}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONDITION_KINDS.map(k => <SelectItem key={k} value={k}>{CONDITION_LABELS[k]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {kind === "opponentAttackKind" && (
        <Controller control={control} name={`${name}.value`} render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">rodzaj ataku</Label>
            <Select value={(field.value as string) ?? "melee"} onValueChange={field.onChange}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{ATTACK_KINDS.map(a => <SelectItem key={a} value={a}>{ATTACK_KIND_LABELS[a]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )} />
      )}
      {(kind === "targetHasStatus" || kind === "selfHasStatus") && (
        <Controller control={control} name={`${name}.status`} render={({ field }) => (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">status</Label>
            <Select value={(field.value as string) ?? "bleeding"} onValueChange={field.onChange}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_IDS.map(s => <SelectItem key={s} value={s}>{statusLabelsPl[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )} />
      )}
      {kind === "hasResource" && (
        <>
          <Controller control={control} name={`${name}.resource`} render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">zasób</Label>
              <Select value={(field.value as string) ?? "essence"} onValueChange={field.onChange}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{RESOURCE_POOL_KINDS.map(r => <SelectItem key={r} value={r}>{RESOURCE_POOL_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )} />
          <EffectField name={`${name}.min`} def={{ path: "min", label: "próg (≥)", kind: "number", def: 1 }} />
        </>
      )}
    </div>
  );
}

function RawJsonField({ name, value }: { name: string; value: LooseEffect })
{
  const { setValue } = useFormContext();
  const valid = effectSchema.safeParse(value).success;
  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="text-xs text-muted-foreground">
        Typ złożony — edycja jako JSON (dedykowany builder w kolejnym etapie).{" "}
        <span className={valid ? "text-emerald-600" : "text-destructive"}>{valid ? "✓ poprawny" : "⚠ niepoprawny wg schematu"}</span>
      </div>
      <textarea
        className="min-h-[120px] w-full rounded-md border bg-background p-2 font-mono text-xs"
        defaultValue={JSON.stringify(value ?? {}, null, 2)}
        onBlur={(e) =>
        {
          try { setValue(name, JSON.parse(e.target.value), { shouldDirty: true, shouldValidate: true }); }
          catch { /* invalid JSON: keep editing, don't commit */ }
        }}
      />
    </div>
  );
}
