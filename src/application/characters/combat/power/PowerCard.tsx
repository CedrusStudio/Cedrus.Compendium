"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { displayedText } from "@/common/translations";
import { Power, Spell, type PowerSpecification } from "@/domain/characters/combat/Power";
import { Field } from '@/common/components/fields';
import { getBadgeVariant, getCastTimeColors } from '@/common/colors';
import { battleIcon, cooldownIcon, costIcon, nextIcon, removePreviousIcon, resetIcon } from '@/common/icons';
import { canUseSpell, EndTurn, type CastTime } from '@/domain/characters/Castable';
import { useMemo, useState } from 'react';
import InfoContentWithTags from '@/common/components/tags/InfoContentWithTags';
import { useQuery } from '@tanstack/react-query';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import PowerRollsCard from '@/application/characters/combat/power/PowerRollsCard';
import ChangeButtons from '@/common/components/buttons/ChangeButtons';
import { Label } from '@/ui/label';
import { gainIcon, lossIcon } from '@/common/icons';
import { DispatchSetInput, setIf } from '@/common/global/resolveSetState';
import PowerOffenseSelector from '@/application/characters/combat/power/PowerOffenseSelector';
import TagsView from '@/common/components/tags/TagsView';
import { cn } from '@/lib/utils';
import CastableSearchFilters from '@/application/characters/combat/CastableSearchFilters';
import { filterCastables, getAvailableCastableTags } from '@/application/characters/combat/castableFilters';

type PowerCardProps =
{
  power: Power;
}

type UsedPowerOffense =
{
  entryType: "power-offense";
  label: string;
  cost: number;
}

type UsedPowerAction = Spell | UsedPowerOffense | EndTurn;

function isUsedPowerOffense(action: UsedPowerAction): action is UsedPowerOffense
{
  return action !== "end" && "entryType" in action && action.entryType === "power-offense";
}

function toCastableHistory(usedActions: UsedPowerAction[]): (Spell | EndTurn)[]
{
  const castableHistory: (Spell | EndTurn)[] = [];

  usedActions.forEach(action =>
  {
    if (action === "end" || !isUsedPowerOffense(action))
    {
      castableHistory.push(action);
    }
  });

  return castableHistory;
}

function renderUsedActionBadge(usedAction: UsedPowerAction, index: number)
{
  if (usedAction === "end")
  {
    return (
      <Badge key={index} variant="destructive" className='m-1' >
        {nextIcon()}
      </Badge>
    );
  }

  if (isUsedPowerOffense(usedAction))
  {
    return (
      <Badge key={index} variant="cost" className='m-1' >
        {usedAction.label}
      </Badge>
    );
  }

  return (
    <Badge key={index} variant={getBadgeVariant(usedAction.castTime)} className='m-1' >
      {usedAction.name}
    </Badge>
  );
}

export default function PowerCard({ power }: PowerCardProps)
{
  const [usedActions, setUsedActions] = useState<UsedPowerAction[]>([]);
  const [currentEssence, setCurrentEssence] = useState<number>(power.essence);
  const [essenceIncrease, setEssenceIncrease] = useState<number>(0);
  const [essenceIncreaseChangeAmount, setEssenceIncreaseChangeAmount] = useState<number>(1);
  const [essenceLoss, setEssenceLoss] = useState<number>(0);
  const [essenceLossChangeAmount, setEssenceLossChangeAmount] = useState<number>(1);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Power offense labels are 1-based, but selector state is 0-based.
  const defaultOffenseIndex = Math.max(0, power.level + power.bonus - 1);
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(defaultOffenseIndex);
  const availableSpellTags = useMemo(() => getAvailableCastableTags(power.spells), [power.spells]);
  const filteredSpells = useMemo(() => filterCastables(power.spells,
  {
    searchTerm: searchInput,
    selectedCastTimes,
    selectedTags,
  }), [power.spells, searchInput, selectedCastTimes, selectedTags]);

  // Fetch the PowerSpecification
  const { data: powerSpecification } = useQuery
  ({
    queryKey: ['powerSpecification', power.powerSpecificationId],
    queryFn: () => powerSpecificationsClient.get(power.powerSpecificationId),
    enabled: !!power.powerSpecificationId && power.powerSpecificationId.length > 0,
    staleTime: 5_000
  });
  const hasPowerOffenses = !!(powerSpecification && powerSpecification.offenses && powerSpecification.offenses.length > 0);
  const selectedPowerOffenseIndex = powerSpecification && powerSpecification.offenses.length > 0
    ? Math.min(selectedOffenseIndex, powerSpecification.offenses.length - 1)
    : -1;
  const selectedPowerOffense = selectedPowerOffenseIndex >= 0
    ? powerSpecification?.offenses[selectedPowerOffenseIndex]
    : undefined;
  const availableEssence = currentEssence + essenceIncrease - essenceLoss;

  const addSpellUse = (spell: Spell) =>
  {
    setUsedActions(prev => [...prev, spell]);
  }

  const addSelectedPowerOffenseUse = (index: number) =>
  {
    if (!powerSpecification || powerSpecification.offenses.length === 0)
    {
      return;
    }

    const offenseIndex = Math.min(index, powerSpecification.offenses.length - 1);
    const offense = powerSpecification.offenses[offenseIndex];

    if (!offense || availableEssence < offense.cost)
    {
      return;
    }

    setUsedActions(prev => [...prev,
    {
      entryType: "power-offense",
      label: `${power.name} ${offenseIndex + 1}`,
      cost: offense.cost,
    }]);

    reduceEssence(offense.cost);
  }

  const removeLastUsage = () =>
  {
    const lastAction = usedActions[usedActions.length - 1];

    if (lastAction && lastAction !== "end")
    {
      setCurrentEssence(prev => Math.min(power.essence, prev + lastAction.cost));
    }

    setUsedActions(prev => prev.slice(0, -1));
  }

  const endTurn = () =>
  {
    setUsedActions(prev => [...prev, "end"]);
  }

  const reduceEssence = (cost: number) =>
  {
    setCurrentEssence(prev => Math.max(0, prev - cost));
  }

  const resetEssence = () =>
  {
    setCurrentEssence(power.essence);
    setEssenceIncrease(0);
    setEssenceLoss(0);
  }

  function setEssenceIncreaseIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setEssenceIncrease(value), dispatchInput, essenceIncrease);
  }

  function setEssenceLossIfPositive(dispatchInput: DispatchSetInput<number>) 
  {
    setIf(newValue => newValue >= 0, (value) => setEssenceLoss(value), dispatchInput, essenceLoss);
  }

  return (
    <Card className='bg-muted'>
      <CardHeader className='gap-4'>
        
        <CardTitle className="flex flex-col lg:flex-row place-content-around place-item-center">

          <div className="mb-4 flex w-fit max-w-full flex-col items-center gap-3 self-center lg:mb-0 lg:items-start lg:self-auto">
            <div className="flex w-fit max-w-full flex-wrap place-items-center place-content-center gap-4">
              <span className="capitalize font-bold text-2xl text-primary">{power.name}</span>
              <Badge variant="outline" className="p-2 capitalize">
                {displayedText[power.type as keyof typeof displayedText] || power.type}
              </Badge>

              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">{displayedText.level}</span>
                <span className="font-bold text-lg text-primary">{power.level}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">{displayedText.bonus}</span>
                <span className="font-bold text-lg text-primary">{power.bonus}</span>
              </div>
            </div>

            {
              powerSpecification && <PowerSpecificationSummary powerSpecification={powerSpecification} compact className="w-full self-center lg:self-start" />
            }
          </div>

          <div className='flex flex-col sm:flex-row justify-center items-center gap-4'>

            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">{displayedText.essence}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-primary">{availableEssence}</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="font-bold text-lg text-muted-foreground">{power.essence}</span>
              </div>
            </div>

            <div className='flex flex-col gap-y-2'>
              <div className='flex gap-2 items-center justify-center'>
                <Label className='text-xs text-muted-foreground'>{gainIcon("size-5")}</Label>
                <ChangeButtons value={essenceIncreaseChangeAmount} setValue={setEssenceIncreaseIfPositive} setChangeAmount={setEssenceIncreaseChangeAmount} resetValue={0} />
              </div>
              <div className='flex gap-2 items-center justify-center'>
                <Label className='text-xs text-muted-foreground'>{lossIcon("size-5")}</Label>
                <ChangeButtons value={essenceLossChangeAmount} setValue={setEssenceLossIfPositive} setChangeAmount={setEssenceLossChangeAmount} resetValue={0} />
              </div>
            </div>
            
          </div>

          {
            powerSpecification && (
              <PowerOffenseSelector 
                powerSpecification={powerSpecification!}
                selectedIndex={selectedOffenseIndex}
                onSelectIndex={setSelectedOffenseIndex}
                onUseSelectedOffense={addSelectedPowerOffenseUse}
                isUseDisabled={!selectedPowerOffense || availableEssence < selectedPowerOffense.cost}
                useButtonLabel={selectedPowerOffense ? `Use ${power.name} ${selectedPowerOffenseIndex + 1}` : undefined}
              />
            )
          }

        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2'>

        {
          hasPowerOffenses && powerSpecification && (
            <div className="col-span-full">
              <PowerRollsCard 
                offenses={powerSpecification.offenses}
                selectedIndex={Math.min(selectedOffenseIndex, powerSpecification.offenses.length - 1)}
              />
            </div>
          )
        }

        {
          power.spells.length > 0 && (
            <div className="col-span-full">
              <CastableSearchFilters
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                selectedCastTimes={selectedCastTimes}
                onSelectedCastTimesChange={setSelectedCastTimes}
                selectedTags={selectedTags}
                onSelectedTagsChange={setSelectedTags}
                availableTags={availableSpellTags}
              />
            </div>
          )
        }

        {
          filteredSpells.map(spell => <SpellView key={spell.id} spell={spell} addSpellUse={addSpellUse} usedActions={usedActions} reduceEssence={reduceEssence} availableEssence={availableEssence} />)
        }

        {
          filteredSpells.length === 0 && (
            <p className='col-span-full text-center text-sm text-muted-foreground'>
              {displayedText.no_spells_found}
            </p>
          )
        }

        <MediumUsedActionsView usedActions={usedActions} removeLastUsage={removeLastUsage} setUsedActions={setUsedActions} endTurn={endTurn} resetEssence={resetEssence} />
        <SmallUsedActionsView usedActions={usedActions} removeLastUsage={removeLastUsage} setUsedActions={setUsedActions} endTurn={endTurn} resetEssence={resetEssence} />
      
      </CardContent>

    </Card>
  );
};

  type PowerSpecificationSummaryProps =
  {
    powerSpecification: PowerSpecification;
    compact?: boolean;
    className?: string;
  }

  function PowerSpecificationSummary({ powerSpecification, compact = false, className }: PowerSpecificationSummaryProps)
  {
    return (
      <div className={cn(
        compact
          ? "rounded-md border border-border/20 bg-background/40 px-3 py-2"
          : "col-span-full rounded-lg border border-border/40 bg-background/70 px-4 py-3",
        className
      )}>
        <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-row place-content-between gap-2 place-items-center">
              <p className={compact ? "text-sm font-semibold leading-snug" : "text-base font-semibold leading-tight"}>{powerSpecification.name}</p>
              <TagsView tags={powerSpecification.tags} variant="secondary" />
            </div>
          </div>

          {
            powerSpecification.description && (
              <p className={compact ? "max-w-3xl text-xs leading-relaxed text-muted-foreground break-words" : "max-w-4xl text-sm leading-relaxed text-muted-foreground break-words"}>
                {powerSpecification.description}
              </p>
            )
          }

        </div>
      </div>
    );
  }

type UsedActionsViewProps =
{
  usedActions: UsedPowerAction[];
  removeLastUsage: () => void;
  setUsedActions: (usedActions: UsedPowerAction[]) => void;
  endTurn: () => void;
  resetEssence: () => void;
}

function SmallUsedActionsView({ usedActions, removeLastUsage, setUsedActions, endTurn, resetEssence }: UsedActionsViewProps)
{
  return (
    <div className="lg:grid-cols-13 col-span-full lg:hidden">

      <div className="text-sm lg:col-span-10 text-muted-foreground italic flex flex-wrap sm:gap-1 lg:gap-2 py-3">
      {
        usedActions.map((usedAction, index) => renderUsedActionBadge(usedAction, index))
      }
      </div>

      <div className="flex gap-4 justify-center items-center">
        <Button variant="default" className='flex-1 lg:flex-0' onClick={() => { setUsedActions([]); resetEssence(); }} aria-label="Reset power usage" title="Reset power usage">
          {resetIcon()}
        </Button>

        <Button variant="default" className='flex-1 lg:flex-0' onClick={removeLastUsage} aria-label="Undo last power usage" title="Undo last power usage">
          {removePreviousIcon()}
        </Button>

        <Button variant="default" className='flex-1 lg:flex-0' onClick={endTurn} aria-label="End power turn" title="End power turn">
          {nextIcon()}
        </Button>
      </div>
    </div>
  );
}

function MediumUsedActionsView({ usedActions, removeLastUsage, setUsedActions, endTurn, resetEssence }: UsedActionsViewProps)
{
  return (
    <div className="hidden lg:grid grid-cols-13 items-center justify-center gap-3 mt-3 pt-4 border-t border-border/40 col-span-full">

      <Button variant="default" className='col-span-1' onClick={() => { setUsedActions([]); resetEssence(); }} aria-label="Reset power usage" title="Reset power usage">
        {resetIcon()}
      </Button>

      <p className="text-sm col-span-10">
        <span className='text-muted-foreground italic'>
        {
          usedActions.map((usedAction, index) => renderUsedActionBadge(usedAction, index))
        }
        </span>
      </p>

      <Button variant="default" className='col-span-1' onClick={removeLastUsage} aria-label="Undo last power usage" title="Undo last power usage">
        {removePreviousIcon()}
      </Button>

      <Button variant="default" className='col-span-1' onClick={endTurn} aria-label="End power turn" title="End power turn">
        {nextIcon()}
      </Button>
    </div>
  );
}

type SpellViewProps =
{
  spell: Spell;
  addSpellUse: (spell: Spell) => void;
  usedActions: UsedPowerAction[];
  reduceEssence: (cost: number) => void;
  availableEssence: number;
}

function SpellView({ spell, addSpellUse, usedActions, reduceEssence, availableEssence }: SpellViewProps) 
{
  const canAffordSpell = availableEssence >= spell.cost;

  const canUseCurrentSpell = (spellToUse: Spell, currentUsedActions: UsedPowerAction[]) =>
  {
    return canUseSpell(spellToUse, toCastableHistory(currentUsedActions)) && canAffordSpell;
  };

  const handleUseSpell = (spell: Spell) =>
  {
    if (!canUseCurrentSpell(spell, usedActions))
    {
      return;
    }

    addSpellUse(spell);
    reduceEssence(spell.cost);
  };

  const isSpellDisabled = !canUseCurrentSpell(spell, usedActions);

  return (
    <div className='flex m-1 p-1 w-full h-full'>

      <div className='flex items-center justify-center p-2 border rounded-l-md flex-1'>
        <Field value={spell.grade} className="gap-1">
          <Field.Label className='w-4xs'>{spell.name}</Field.Label>
          <Field.Value />
          <Field.Info className={`${getCastTimeColors(spell.castTime).text}`}>
            <InfoContentWithTags castable={spell} />
          </Field.Info>
        </Field>
      </div>

      <div className='flex items-center justify-center'>
        <Button type="button" variant="ghost" className="h-full gap-0 p-0" onClick={() => handleUseSpell(spell)} disabled={isSpellDisabled} aria-label={`Use ${spell.name}`} title={`Use ${spell.name}`}>
          <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-r-none' variant="cost">
            <span className="scale-100">{costIcon}</span>
            <span>{spell.cost}</span>
          </Badge>
          <Badge className='flex p-2 w-15 h-full items-center justify-center rounded-l-none' variant={getBadgeVariant(spell.castTime)}>
            {cooldownIcon()}
            <span>{spell.cooldown || battleIcon("scale-80")}</span>
          </Badge>
        </Button>
      </div>

    </div>
  );
}
