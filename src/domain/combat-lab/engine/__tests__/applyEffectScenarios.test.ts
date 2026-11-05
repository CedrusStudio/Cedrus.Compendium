import { describe, expect, it } from 'vitest';
import { applyEffects, evaluateCondition } from '../applyEffect';
import { CombatLogBuilder } from '../CombatLog';
import { createRuntime } from '../CombatState';
import { makeDefense, makeSnapshot } from './engineFixtures';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';
import type { Effect, SaveTestEffect, TestSide } from '@/domain/combat-lab/effects/Effect';

const damage = (bonus: number): Effect => ({
  type: 'damage', damageType: 'zwyczajne', damage: { amount: 0, grade: 0, bonus },
});

function fight()
{
  const source = createRuntime(makeSnapshot('attacker'));
  const target = createRuntime(makeSnapshot('target'));
  const log = new CombatLogBuilder(1);
  return { source, target, log, context: { log, random: () => 0 } };
}

describe('combat effects and their targets', () => {
  it('stacks a refreshed status, replaces its tick and keeps only one control', () => {
    const { source, target, log, context } = fight();
    const tick = { damage: { amount: 0, grade: 0, bonus: 3 }, damageType: 'śmiertelne' } as const;
    applyEffects([
      { type: 'status', status: 'poisoned', duration: 5, stacks: 2 },
      { type: 'status', status: 'marked', duration: 4 },
      { type: 'status', status: 'poisoned', duration: 2, tick },
      { type: 'status', status: 'poisoned', duration: 6 },
      { type: 'control', control: 'stun', duration: 2 },
      { type: 'control', control: 'root', duration: 1 },
      { type: 'control', control: 'stun', duration: 4 },
    ], source, target, context);
    expect(target.statuses).toEqual([
      { status: 'poisoned', remaining: 6, stacks: 4, tick },
      { status: 'marked', remaining: 4, stacks: 1, tick: undefined },
    ]);
    expect(target.controls).toEqual([{ control: 'stun', remaining: 4 }, { control: 'root', remaining: 1 }]);
    expect(source.statuses).toEqual([]);
    expect(log.build().events.at(-1)).toMatchObject({ kind: 'control', sourceId: 'attacker', targetId: 'target', duration: 4 });
  });

  it('routes debuffs to the target and refreshes crit suppression without shortening it', () => {
    const { source, target, log, context } = fight();
    const profile = { ...createDefaultBuffProfile(), id: 'vulnerability' };
    source.snapshot.buffProfiles.push(profile);
    applyEffects([
      { type: 'debuff', profile: { profileId: profile.id }, duration: 2 },
      { type: 'debuff', profile: { profileId: profile.id }, duration: 4 },
      { type: 'stat', mode: 'target', duration: 3, critDisabled: true },
      { type: 'stat', mode: 'target', duration: 1, critDisabled: true },
    ], source, target, context);
    expect(source.activeBuffs).toEqual([]);
    expect(target.activeBuffs.filter(buff => buff.profile.id === profile.id)).toEqual([{ profile, remaining: 4 }]);
    expect(target.critSuppressedRemaining).toBe(3);
    expect(log.build().events[0]).toMatchObject({ kind: 'buff', mode: 'debuff', targetId: 'target' });
  });

  it('logs action resources and movement without debiting the essence pool', () => {
    const { source, target, context, log } = fight();
    source.resources.essence = 3;
    target.resources.essence = 5;
    applyEffects([
      { type: 'resource', resource: 'action', delta: 2 },
      { type: 'resource', resource: 'action', delta: -1 },
      { type: 'push', distance: 2 },
      { type: 'pull', distance: 1 },
    ], source, target, context);
    expect(source.resources.essence).toBe(3);
    expect(target.resources.essence).toBe(5);
    expect(log.build().events).toEqual([
      { kind: 'resource', targetId: 'attacker', resource: 'action', delta: 2 },
      { kind: 'resource', targetId: 'target', resource: 'action', delta: -1 },
      { kind: 'move', sourceId: 'attacker', targetId: 'target', direction: 'push', distance: 2 },
      { kind: 'move', sourceId: 'attacker', targetId: 'target', direction: 'pull', distance: 1 },
    ]);
  });

  it('evaluates the named status on the intended side and treats no attack as no damage', () => {
    const { source, target, context } = fight();
    applyEffects([{ type: 'status', status: 'marked', duration: 2 }], source, target, context);
    applyEffects([{ type: 'status', status: 'poisoned', duration: 2 }], target, source, context);

    expect(evaluateCondition({ kind: 'targetHasStatus', status: 'marked' }, source, target)).toBe(true);
    expect(evaluateCondition({ kind: 'targetHasStatus', status: 'poisoned' }, source, target)).toBe(false);
    expect(evaluateCondition({ kind: 'selfHasStatus', status: 'poisoned' }, source, target)).toBe(true);
    expect(evaluateCondition({ kind: 'selfHasStatus', status: 'marked' }, source, target)).toBe(false);
    expect(evaluateCondition({ kind: 'onDamageDealt' }, source, target)).toBe(false);
  });

  it('handles damage against empty defenses and halved guards without losing other layers', () => {
    const { source, target, context } = fight();
    target.snapshot.defenses = [];
    applyEffects([damage(10)], source, target, context);
    expect(target.currentHp).toBe(30);

    const defense = makeDefense('guard', { block: 4, parry: 4, dodge: 2, protection: 2 });
    target.snapshot.defenses = [defense];
    target.snapshot.defaultDefenseId = defense.id;
    applyEffects([{ type: 'status', status: 'stagger', duration: 2 }, damage(10)], source, target, context);
    expect(target.currentHp).toBe(27);
  });

  it('extends a matching tag ban while keeping independent scopes and caster ownership', () => {
    const { source, target, context } = fight();
    applyEffects([
      { type: 'forbidTag', tag: 'defensywne', scope: 'maneuvers', duration: 2 },
      { type: 'forbidTag', tag: 'defensywne', scope: 'stances', duration: 1 },
      { type: 'forbidTag', tag: 'ofensywne', scope: 'maneuvers', duration: 1 },
      { type: 'forbidTag', tag: 'defensywne', scope: 'maneuvers', duration: 4 },
    ], source, target, context);
    expect(source.forbiddenTags).toEqual([
      { tag: 'defensywne', scope: 'maneuvers', remaining: 4 },
      { tag: 'defensywne', scope: 'stances', remaining: 1 },
      { tag: 'ofensywne', scope: 'maneuvers', remaining: 1 },
    ]);
    expect(target.forbiddenTags).toEqual([]);
  });

  it('uses the active state when a stance is absent and safely handles no active mode', () => {
    const { source, target, context } = fight();
    applyEffects([{ type: 'stanceRank', target: 'state', delta: 1, duration: 2 }], source, target, context);
    expect(source.activeState).toBeUndefined();
    const mode = { name: 'Skupienie', baseGrade: 1, variantsByGrade: { 1: [], 2: [] } };
    const withState = createRuntime({ ...source.snapshot, state: mode });
    applyEffects([
      { type: 'stanceRank', delta: 1, duration: 2 },
      { type: 'stanceRank', target: 'state', delta: 2, duration: 1 },
    ], withState, target, context);
    expect(withState.activeState).toMatchObject({ rankBonus: 2, rankBonusRemaining: 2 });
    expect(withState.activeStance).toBeUndefined();

    const withStance = createRuntime({ ...source.snapshot, stance: mode });
    applyEffects([{ type: 'stanceRank', target: 'state', delta: 1, duration: 2 }], withStance, target, context);
    expect(withStance.activeStance).toMatchObject({ rankBonus: 1, rankBonusRemaining: 2 });
  });

  it.each([undefined, 2])('scales won contested effects on self using the margin (cap %s)', cap => {
    const { source, target, context, log } = fight();
    const empty: TestSide = { pool: [] };
    applyEffects([{
      type: 'contested', attacker: { ...empty, modifier: 7 }, defender: empty,
      onWinTarget: 'self', onWin: [damage(1)], perMargin: { per: 2, cap, effect: damage(2) },
    }], source, target, context);
    expect(source.currentHp).toBe(cap === undefined ? 33 : 35);
    expect(target.currentHp).toBe(40);
    expect(log.build().events[0]).toMatchObject({ kind: 'contestedTest', margin: 7, win: true });
  });

  it.each([undefined, 2])('scales a failed self save but applies nothing on success (cap %s)', cap => {
    const { source, target, context, log } = fight();
    const save: SaveTestEffect = {
      type: 'save', who: 'self', pool: { pool: [] }, st: 8, onFail: [damage(1)],
      perMarginOfFailure: { per: 2, cap, effect: damage(2) },
    };
    applyEffects([save, { ...save, st: 1 }], source, target, context);
    expect(source.currentHp).toBe(cap === undefined ? 33 : 35);
    expect(target.currentHp).toBe(40);
    expect(log.build().events.filter(event => event.kind === 'saveTest')).toMatchObject([
      { targetId: 'attacker', failMargin: 7, failed: true }, { targetId: 'attacker', failMargin: 0, failed: false },
    ]);
  });

  it('logs a failed chance roll without applying the nested effect', () => {
    const { source, target, context, log } = fight();
    applyEffects([{ type: 'chance', chance: 20, then: [damage(6)] }], source, target, { ...context, random: () => 0.2 });
    expect(target.currentHp).toBe(40);
    expect(log.build().events).toEqual([{ kind: 'chanceRolled', sourceId: 'attacker', chance: 20, passed: false }]);
  });
});
