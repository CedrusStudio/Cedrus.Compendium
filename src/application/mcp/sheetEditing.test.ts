import { describe, expect, it, vi } from 'vitest';
import { ulid } from 'ulid';
import type { Prisma } from '@prisma/client';
import { editInput, type EditOperation } from '@/domain/mcp/writeContracts';
import { activeFields, profileGroups } from '@/domain/mcp/sheetContracts';
import { createDefaultModifierProfile } from '@/domain/characters/buffs/BuffProfile';
import { digest } from '@/persistence/mcp/changeIdentity';
import { planSheetEdit } from './planSheetEdit';
import { sheetFixture } from '@/__tests__/fixtures/mcpCharacterSheet';
import { fullSheet, loadSheet, verificationSections } from './sheetRead';
import { inspectSheet } from './sheetAudit';

vi.unmock('ulid');

function setup() {
  const sheet = sheetFixture();
  const first = sheet.shields[0];
  Object.assign(first, { name: 'Small shield', block: 7, characterIds: ['hidden-character'] });
  sheet.defenses[0].block = 7;
  const second = { ...first, id: ulid(), name: 'Medium shield', block: 9 };
  const spell = {
    id: ulid(),
    name: 'Spell',
    castTime: 'Standardowa',
    grade: 1,
    price: 1,
    description: 'Spell',
    tags: [],
    replaces: [],
    characterIds: [],
  };
  const spec = {
    id: ulid(),
    name: 'Specification',
    description: 'Spec',
    tags: [],
    offenses: [],
    characterIds: [],
  };
  const repo = {
    shield: { findUnique: vi.fn(async () => second) },
    spell: { findUnique: vi.fn(async () => spell) },
    powerSpecification: { findUnique: vi.fn(async () => spec) },
    race: { findUnique: vi.fn() },
    character: { findFirst: vi.fn(), findUnique: vi.fn(async () => sheet) },
  };
  const tx = repo as unknown as Prisma.TransactionClient;
  const plan = (...ops: EditOperation[]) =>
    planSheetEdit(
      tx,
      sheet,
      editInput.parse({ characterId: sheet.id, requestId: 'draft', operations: ops }).operations,
    );
  return { sheet, first, second, spell, spec, tx, repo, plan };
}

describe('full character edits', () => {
  it('previews the shield swap and the chosen defense, preserving training and unrelated UI changes', async () => {
    const { sheet, first, second, plan } = setup();
    const id = sheet.defenses[0].id;
    const ops: EditOperation[] = [
      { op: 'replaceGear', group: 'shields', fromId: first.id, toId: second.id },
      { op: 'patchItem', group: 'defenses', id, fields: { block: 9 } },
    ];
    const preview = await plan(...ops);
    expect(preview.differences).toEqual([
      { field: 'shields/' + first.id, label: first.name, before: true, after: false },
      { field: 'shields/' + second.id, label: second.name, before: false, after: true },
      { field: 'defenses/' + id + '/block', label: sheet.defenses[0].name, before: 7, after: 9 },
    ]);
    expect(preview.update).toMatchObject({
      shields: { connect: [{ id: second.id }], disconnect: [{ id: first.id }] },
    });
    expect(preview.update).not.toHaveProperty('offenses');
    expect(sheet.defenses[0].block).toBe(7);
    sheet.defenses[0].parry = 4;
    const latest = await plan(...ops);
    expect(latest.impact).toEqual(preview.impact);
    expect(latest.update.defenses).toMatchObject([{ parry: 4, block: 9 }]);
    second.characterIds.push('unrelated');
    expect((await plan(...ops)).dependencies).toEqual(preview.dependencies);
    second.block = 12;
    expect((await plan(...ops)).dependencies).not.toEqual(preview.dependencies);
  });

  it.each(profileGroups)(
    'adds, activates and edits a %s profile and shows its effective block',
    async (group) => {
      const { sheet, plan } = setup();
      const id = ulid();
      const ops: EditOperation[] = [
        { op: 'addItem', group, id, fields: { name: 'Cover', 'defense.block': 2 } },
        { op: 'activateProfile', group, id, active: true },
      ];
      const preview = await plan(...ops);
      expect(preview.update[activeFields[group]]).toEqual([id]);
      expect(preview.impact.effective).toContainEqual(
        expect.objectContaining({
          field: 'defenses/' + sheet.defenses[0].id + '/block',
          before: 7,
          after: 9,
        }),
      );
      expect(await plan(...ops)).toEqual(preview);
      Object.assign(sheet, preview.update);
      const next = await plan({ op: 'patchItem', group, id, fields: { 'defense.block': 3 } });
      expect(next.impact.effective).toContainEqual(expect.objectContaining({ before: 9, after: 10 }));
      const removal = await plan({ op: 'removeItem', group, id });
      expect(removal.update[activeFields[group]]).toEqual([]);
      expect(removal.differences).toContainEqual(
        expect.objectContaining({ field: activeFields[group] + '/' + id, before: true, after: false }),
      );
      expect(
        (await plan({ op: 'removeItem', group, id }, { op: 'activateProfile', group, id, active: false }))
          .update[group],
      ).toEqual([]);
    },
  );

  it('uses the union across powers when spells and specifications are shared', async () => {
    const { sheet, plan, spec, spell } = setup();
    const ids = [ulid(), ulid()];
    const ops = ids.flatMap((id): EditOperation[] => [
      {
        op: 'addItem',
        group: 'powers',
        id,
        fields: { name: 'Magic', powerSpecificationId: spec.id, level: 2, essence: 10 },
      },
      { op: 'powerSpell', powerId: id, spellId: spell.id, present: true },
    ]);
    const create = await plan(...ops);
    expect(create.update.spells).toEqual({ connect: [{ id: spell.id }], disconnect: [] });
    expect(create.update.powerSpecifications).toEqual({ connect: [{ id: spec.id }], disconnect: [] });
    Object.assign(sheet, {
      powers: create.update.powers,
      spells: [spell],
      spellsIds: [spell.id],
      powerSpecifications: [spec],
      powerSpecificationsIds: [spec.id],
    });
    const retain = await plan({ op: 'removeItem', group: 'powers', id: ids[0] });
    expect(retain.update).not.toHaveProperty('spells');
    expect(retain.update).not.toHaveProperty('powerSpecifications');
    Object.assign(sheet, retain.update);
    const unlink = await plan({ op: 'powerSpell', powerId: ids[1], spellId: spell.id, present: false });
    expect(unlink.update.spells).toEqual({ connect: [], disconnect: [{ id: spell.id }] });
    expect(unlink.update).not.toHaveProperty('powerSpecifications');
    const last = await plan({ op: 'removeItem', group: 'powers', id: ids[1] });
    expect(last.update.powerSpecifications).toEqual({ connect: [], disconnect: [{ id: spec.id }] });
  });

  it('exposes only requested public card data, including catalog fields and per-power spell IDs', async () => {
    const { sheet, tx, first } = setup();
    const visible = await loadSheet(tx, sheet.id, sheet.apiKeys[0]);
    const read = fullSheet(visible);
    expect(read).toMatchObject({
      equipment: { shields: [{ id: first.id, block: 7 }] },
      combat: { base: { health: sheet.health }, effective: { health: sheet.health } },
    });
    expect(JSON.stringify(read)).not.toMatch(/hidden-character|apiKeys|local-fixture-key|characterIds/);
    expect(Object.keys(fullSheet(sheet, ['buffs'])).sort()).toEqual(['buffs', 'href', 'id', 'kind', 'name']);
    await expect(loadSheet(tx, sheet.id, 'another-key')).rejects.toMatchObject({ status: 404 });
  });

  it('allows a public sheet and restricts post-save readback to affected sections', async () => {
    const { sheet, tx } = setup();
    sheet.apiKeys = [];
    await expect(loadSheet(tx, sheet.id, 'another-key')).resolves.toBe(sheet);
    expect(verificationSections([{ field: 'shields/item' }, { field: 'defenses/d/block' }])).toEqual([
      'equipment',
      'combat',
    ]);
    expect(verificationSections([{ field: 'activeStateModifierProfileIds/p' }]).sort()).toEqual([
      'buffs',
      'combat',
      'statistics',
    ]);
  });

  it('removes an orphan reference by ID without issuing a disconnect against a missing row', async () => {
    const { sheet, plan, repo } = setup();
    const id = ulid();
    sheet.shieldsIds.push(id);
    repo.shield.findUnique.mockImplementation(async () => null as unknown as (typeof sheet.shields)[number]);
    const preview = await plan({ op: 'gear', group: 'shields', entityId: id, present: false });
    expect(preview.orphanCleanup).toEqual({ shieldsIds: { set: [sheet.shields[0].id] } });
    expect(preview.update).not.toHaveProperty('shields');
    expect(preview.impact.resolved).toContainEqual(
      expect.objectContaining({ rule: 'catalog.missing', observed: id }),
    );
  });

  it('accepts targeted optional fields and validates nested paths, numbers and defaults', async () => {
    const { sheet, plan } = setup(),
      id = sheet.offenses[0].id;
    const patch = (fields: Record<string, string | number | boolean | null>) =>
      plan({ op: 'patchItem', group: 'offenses', id, fields });
    const initialized = await patch({ 'secondaryWeapon.amount': 2, 'secondaryWeapon.critical.power': 1 });
    expect(initialized.differences).toMatchObject([
      {
        field: 'offenses/' + id + '/secondaryWeapon',
        before: null,
        after: { amount: 2, critical: { power: 1 } },
      },
    ]);
    Object.assign(sheet, initialized.update);
    expect((await patch({ secondaryWeapon: null })).differences).toMatchObject([{ after: null }]);
    const invalidFields: Parameters<typeof patch>[0][] = [
      { id: 'other' },
      { 'leadingWeapon.constructor': 1 },
      { 'leadingWeapon.amount': false },
      { 'leadingWeapon.amount': null },
      { 'leadingWeapon.amount': -99 },
    ];
    for (const fields of invalidFields) await expect(patch(fields)).rejects.toThrow();
    await expect(plan({ op: 'removeItem', group: 'offenses', id })).rejects.toThrow(/default.missing/);
    expect(
      (
        await plan(
          { op: 'removeItem', group: 'offenses', id },
          { op: 'defaultSet', group: 'offenses', id: null },
        )
      ).update.offenses,
    ).toEqual([]);
  });

  it('audits dangling links, ambiguous shield evidence and requirements without mutating the sheet', async () => {
    const { sheet, plan } = setup();
    sheet.offenses[0].leadingWeapon.amount = 1;
    const perk = {
      id: ulid(),
      name: 'Strong Guard',
      description: 'Strength requirement',
      price: 1,
      grade: 1,
      tags: [],
      replaces: [],
      characterIds: [],
      structuredRequirements: [
        { kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 8 },
        { kind: 'rankless', text: 'Game master approval' },
      ],
    };
    sheet.perks = [perk];
    sheet.perksIds = [perk.id];
    const checks = inspectSheet(sheet, ['requirements']);
    expect(checks).toContainEqual(
      expect.objectContaining({
        rule: 'requirement.unmet',
        severity: 'advisory',
        observed: 0,
        path: 'perks/' + perk.id,
        source: '/compendium/perks',
      }),
    );
    expect(checks).toContainEqual(expect.objectContaining({ rule: 'requirement.unmet', severity: 'manual' }));
    sheet.defaultDefenseId = 'dangling';
    sheet.activeBuffProfileIds = [ulid()];
    const digestBefore = digest(sheet);
    const found = inspectSheet(sheet, ['combat', 'buffs']);
    expect(digest(sheet)).toBe(digestBefore);
    expect(found).toContainEqual(
      expect.objectContaining({ rule: 'combat.singleDie', severity: 'manual', observed: 1 }),
    );
    const fixes = found.flatMap((f) => (f.repair ? [f.repair] : []));
    const repair = await plan(...fixes);
    expect(repair.impact.resolved.map((f) => f.rule)).toEqual(
      expect.arrayContaining(['profile.activeMissing', 'default.missing']),
    );
    sheet.defaultDefenseId = sheet.defenses[0].id;
    sheet.defenses[0].block = 3;
    expect(inspectSheet(sheet, ['combat'])).toContainEqual(
      expect.objectContaining({ rule: 'combat.shieldBlock', severity: 'manual' }),
    );
    expect(inspectSheet(sheet, ['talents'])).toEqual([]);
    sheet.stanceModifierProfiles = [
      {
        ...createDefaultModifierProfile(),
        linkedEntityId: ulid(),
      } as (typeof sheet.stanceModifierProfiles)[number],
    ];
    expect(inspectSheet(sheet, ['buffs'])).toContainEqual(
      expect.objectContaining({ rule: 'profile.missingLink' }),
    );
  });

  it('edits individual header, health and talent fields, and checks conflicting names at preview', async () => {
    const { sheet, repo, plan } = setup();
    const id = ulid();
    const added = await plan(
      { op: 'addItem', group: 'talents', id, fields: { name: 'Tracking', grade: 3 } },
      { op: 'header', field: 'shortName', value: 'Scout' },
      { op: 'health', field: 'vitality', value: 13 },
    );
    expect(added.update).toMatchObject({
      shortName: 'Scout',
      health: { vitality: 13 },
      talents: expect.arrayContaining([expect.objectContaining({ id, grade: 3 })]),
    });
    Object.assign(sheet, added.update);
    expect(
      (await plan({ op: 'patchItem', group: 'talents', id, fields: { grade: 4 } })).differences,
    ).toMatchObject([{ before: 3, after: 4 }]);
    repo.character.findFirst.mockResolvedValue({ id: 'occupied' });
    await expect(plan({ op: 'header', field: 'name', value: 'Existing' })).rejects.toThrow(/already in use/);
    await expect(plan({ op: 'health', field: 'vitality', value: 0 })).rejects.toThrow();
  });
});
