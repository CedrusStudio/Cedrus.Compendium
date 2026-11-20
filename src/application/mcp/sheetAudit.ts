import { z } from 'zod';
import { getStatisticTotalTestValue } from '@/domain/characters/statistics/Statistic';
import { statisticSchema } from '@/persistence/schemas/characters/statistics/statisticSchema';
import { healthSchema } from '@/persistence/schemas/characters/combat/healthSchema';
import { talentSchema } from '@/persistence/schemas/characters/talentSchema';
import { auditInput, activeFields, profileGroups, gearGroups } from '@/domain/mcp/sheetContracts';
import { membershipKinds } from '@/domain/characters/characterMembership';
import type { EditOperation } from '@/domain/mcp/writeContracts';
import { checkRequirement, requirementEvidence } from '@/domain/requirements/checkRequirement';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import { readStructuredRequirements } from '@/domain/requirements/legacyRequirementAudit';
import { reviewCombatFindings } from '@/domain/ai-character-generation/reviewAiCharacterProposalCombat';
import { selectBalanceProfiles } from '@/domain/ai-character-generation/buildBalanceProfiles';
import { compareToBalanceProfile } from '@/domain/ai-character-generation/compareToBalanceProfile';
import { loadAiCharacterBalanceProfiles } from '@/persistence/ai-character-generation/aiCharacterBalanceRepository';
import { type CharacterWithRelations, toCharacter } from '@/persistence/mappings/characterMapping';
import prisma from '@/lib/prisma';
import { loadSheet } from './sheetRead';

export type Finding = {
  rule: string;
  severity: 'integrity' | 'advisory' | 'manual';
  path: string;
  observed: unknown;
  expected: unknown;
  source: string;
  repair?: EditOperation;
};
type Sections = z.infer<typeof auditInput>['sections'];
export function inspectSheet(row: CharacterWithRelations, sections?: Sections) {
  const c = toCharacter(row);
  const findings: Finding[] = [];
  const includes = (section: NonNullable<Sections>[number]) => !sections || sections.includes(section);
  const integrity = (
    rule: string,
    path: string,
    observed: unknown,
    expected: unknown,
    repair?: EditOperation,
  ) =>
    findings.push({
      rule,
      severity: 'integrity',
      path,
      observed,
      expected,
      source: 'character sheet',
      ...(repair && { repair }),
    });

  for (const group of ['offenses', 'defenses'] as const) {
    if (!includes('combat')) continue;
    const field = group === 'offenses' ? 'defaultOffenseId' : 'defaultDefenseId';
    if (row[field] && !row[group].some((item) => item.id === row[field]))
      integrity('default.missing', field, row[field], group, {
        op: 'defaultSet',
        group,
        id: row[group].length === 1 ? row[group][0].id : null,
      });
  }
  for (const group of [...profileGroups, 'powers', 'talents', 'defenses', 'offenses'] as const) {
    const section =
      group === 'powers' || group === 'talents'
        ? group
        : group === 'defenses' || group === 'offenses'
          ? 'combat'
          : 'buffs';
    if (!includes(section)) continue;
    const seen = new Set<string>();
    for (const item of row[group]) {
      if (seen.has(item.id)) integrity('id.duplicate', group + '/' + item.id, item.id, 'unique ID');
      seen.add(item.id);
    }
  }
  if (includes('buffs')) {
    const profileIds = new Set<string>();
    for (const group of profileGroups) {
      for (const profile of row[group]) {
        if (profileIds.has(profile.id))
          integrity(
            'profile.duplicateId',
            group + '/' + profile.id,
            profile.id,
            'unique across profile categories',
          );
        profileIds.add(profile.id);
      }
      for (const id of row[activeFields[group]]) {
        if (!row[group].some((p) => p.id === id))
          integrity('profile.activeMissing', activeFields[group] + '/' + id, id, group, {
            op: 'activateProfile',
            group,
            id,
            active: false,
          });
      }
      for (const profile of row[group]) {
        if (!profile.linkedEntityId) continue;
        const relations =
          group === 'stanceModifierProfiles'
            ? row.stances
            : group === 'stateModifierProfiles'
              ? row.states
              : [];
        if (!relations.some((e) => e.id === profile.linkedEntityId))
          integrity('profile.missingLink', group + '/' + profile.id, profile.linkedEntityId, 'owned mode', {
            op: 'patchItem',
            group,
            id: profile.id,
            fields: { linkedEntityId: null },
          });
      }
    }
  }
  for (const group of [...gearGroups, ...membershipKinds, 'spells', 'powerSpecifications'] as const) {
    const section =
      group === 'spells' || group === 'powerSpecifications'
        ? 'powers'
        : (gearGroups as readonly string[]).includes(group)
          ? 'equipment'
          : 'requirements';
    if (!includes(section)) continue;
    const found = new Set(row[group].map((entry) => entry.id));
    for (const id of row[`${group}Ids`]) {
      if (found.has(id)) continue;
      const gear = z.enum(gearGroups).safeParse(group);
      const membership = z.enum(membershipKinds).safeParse(group);
      let repair: EditOperation | undefined;
      if (gear.success) repair = { op: 'gear', group: gear.data, entityId: id, present: false };
      if (membership.success)
        repair = { op: 'membership', kind: membership.data, entityId: id, present: false };
      integrity('catalog.missing', group + '/' + id, id, 'existing catalog entry', repair);
    }
  }
  if (includes('powers')) {
    for (const power of row.powers) {
      if (!row.powerSpecifications.some((spec) => spec.id === power.powerSpecificationId))
        integrity(
          'power.missingSpecification',
          'powers/' + power.id,
          power.powerSpecificationId,
          'linked specification',
        );
      for (const id of power.spellsIds)
        if (!row.spells.some((spell) => spell.id === id))
          integrity('power.missingSpell', 'powers/' + power.id + '/spells/' + id, id, 'linked spell');
    }
    for (const [group, used] of [
      ['spells', row.powers.flatMap((p) => p.spellsIds)],
      ['powerSpecifications', row.powers.map((p) => p.powerSpecificationId)],
    ] as const)
      for (const id of row[`${group}Ids`])
        if (!used.includes(id))
          integrity('power.unusedRelation', group + '/' + id, id, 'referenced by a power');
  }
  const inspectValues = (path: string, value: Record<string, unknown>, schema: z.ZodType) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '');
        integrity('sheet.invalidValue', path + '/' + field, value[field] ?? null, issue.message);
      }
  };
  if (includes('statistics')) {
    for (const group of ['characteristics', 'attributes'] as const)
      for (const [name, stat] of Object.entries(row[group]))
        inspectValues(group + '/' + name, stat, statisticSchema);
  }
  if (includes('talents'))
    for (const talent of row.talents) inspectValues('talents/' + talent.id, talent, talentSchema);
  if (includes('combat')) inspectValues('health', row.health, healthSchema);
  if (includes('equipment')) {
    const strength = getStatisticTotalTestValue(c.characteristics.strength);
    for (const group of ['shields', 'armors'] as const)
      for (const item of c.equipment[group]) {
        if (item.strengthRequirement > strength)
          findings.push({
            rule: 'equipment.strength',
            severity: 'advisory',
            path: group + '/' + item.id,
            observed: strength,
            expected: item.strengthRequirement,
            source: '/compendium/equipment/' + group,
          });
      }
  }
  if (includes('requirements')) {
    for (const group of [...membershipKinds, 'spells'] as const)
      for (const entry of row[group]) {
        for (const requirement of readStructuredRequirements(entry)) {
          if (checkRequirement(requirement, c)) continue;
          const manual =
            requirement.kind === 'rankless' ||
            (requirement.kind === 'anyOf' &&
              requirement.options.some((option) => option.kind === 'rankless'));
          findings.push({
            rule: 'requirement.unmet',
            severity: manual ? 'manual' : 'advisory',
            path: group + '/' + entry.id,
            observed: requirementEvidence(requirement, c),
            expected: formatRequirement(requirement),
            source: '/compendium/' + group,
          });
        }
      }
  }
  if (includes('combat')) {
    const defense = c.defenses.find((item) => item.id === c.defaultDefenseId);
    const [shield] = c.equipment.shields;
    if (defense && c.equipment.shields.length === 1 && defense.block !== shield.block)
      findings.push({
        rule: 'combat.shieldBlock',
        severity: 'manual',
        path: 'defenses/' + defense.id + '/block',
        observed: defense.block,
        expected: { shieldId: shield.id, block: shield.block },
        source: '/compendium/equipment/shields',
      });
    if (defense && c.equipment.shields.length > 1)
      findings.push({
        rule: 'combat.ambiguousShield',
        severity: 'manual',
        path: 'defenses/' + defense.id + '/block',
        observed: {
          block: defense.block,
          shields: c.equipment.shields.map(({ id, name, block }) => ({ id, name, block })),
        },
        expected: 'Select the shield and defense set to compare.',
        source: '/compendium/equipment/shields',
      });
    for (const note of reviewCombatFindings({ combat: c, perks: c.perks, equipment: c.equipment }))
      findings.push({
        rule: note.rule,
        severity: 'manual',
        path: note.path,
        observed: note.observed,
        expected: note.message,
        source: 'Compendium combat review',
      });
  }
  const sectionFor = (f: Finding) => {
    const [group] = f.path.split('/');
    if (f.rule.startsWith('requirement') || (membershipKinds as readonly string[]).includes(group))
      return 'requirements';
    if ((gearGroups as readonly string[]).includes(group)) return 'equipment';
    if (group.includes('Profile')) return 'buffs';
    if (['powers', 'spells', 'powerSpecifications'].includes(group)) return 'powers';
    if (group === 'talents') return 'talents';
    if (group === 'characteristics' || group === 'attributes') return 'statistics';
    return 'combat';
  };
  return findings
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path, 'en') ||
        a.rule.localeCompare(b.rule, 'en') ||
        JSON.stringify(a.expected).localeCompare(JSON.stringify(b.expected), 'en'),
    )
    .map((f) => ({ ...f, section: sectionFor(f), basis: 'base' as const }));
}

export async function auditCharacter(input: z.infer<typeof auditInput>, key: string) {
  const row = await loadSheet(prisma, input.characterId, key);
  const findings = inspectSheet(row, input.sections);
  const profiles =
    !input.sections || input.sections.includes('statistics') ? await loadAiCharacterBalanceProfiles(key) : [];
  const balance = selectBalanceProfiles(profiles, row.tags.join(' ')).map((profile) =>
    compareToBalanceProfile(
      {
        attributes: row.attributes,
        maneuverCount: row.maneuversIds.length,
        perkCount: row.perksIds.length,
      },
      profile,
    ),
  );
  return { characterId: row.id, href: '/characters/' + row.id, basis: 'base', findings, balance };
}
