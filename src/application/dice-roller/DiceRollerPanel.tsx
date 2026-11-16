'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { languageSettings } from '@/lib/env';
import { defaultRollPreset, formatDicePool, formatRollPreset, maxDicePools, validateRollPreset, type DicePool, type DicePoolNames, type RollPreset, type RollRecord } from '@/domain/diceRoller';
import { X } from 'lucide-react';

const copy = {
  'pl-PL': { title: 'Kości', quick: 'Szybki rzut', newRoll: 'Nowy rzut', group: 'Grupa', addGroup: 'Dodaj grupę kości', removeGroup: 'Usuń grupę', count: 'Liczba kości', kind: 'Kość', bonus: 'Premia', perDie: 'Do każdej kości', perPool: 'Raz do grupy', modifier: 'Modyfikator całego rzutu', roll: 'Rzuć', result: 'Wynik', history: 'Historia', repeat: 'Powtórz', clear: 'Wyczyść historię', confirm: 'Wyczyścić historię rzutów?', cancel: 'Anuluj', clearNow: 'Wyczyść', close: 'Zamknij kości', reroll: 'Przerzuć kość', critical: 'Krytyk', phantom: 'Widmowa', noHistory: 'Tutaj pojawią się ostatnie rzuty.', open: 'Otwórz kości' },
  'de-DE': { title: 'Würfel', quick: 'Schneller Wurf', newRoll: 'Neuer Wurf', group: 'Gruppe', addGroup: 'Würfelgruppe hinzufügen', removeGroup: 'Gruppe entfernen', count: 'Anzahl Würfel', kind: 'Würfel', bonus: 'Bonus', perDie: 'Pro Würfel', perPool: 'Einmal pro Gruppe', modifier: 'Modifikator des gesamten Wurfs', roll: 'Würfeln', result: 'Ergebnis', history: 'Verlauf', repeat: 'Wiederholen', clear: 'Verlauf löschen', confirm: 'Wurfverlauf löschen?', cancel: 'Abbrechen', clearNow: 'Löschen', close: 'Würfel schließen', reroll: 'Würfel erneut werfen', critical: 'Kritisch', phantom: 'Phantom', noHistory: 'Die letzten Würfe erscheinen hier.', open: 'Würfel öffnen' },
  'fr-FR': { title: 'Dés', quick: 'Lancer rapide', newRoll: 'Nouveau lancer', group: 'Groupe', addGroup: 'Ajouter un groupe de dés', removeGroup: 'Supprimer le groupe', count: 'Nombre de dés', kind: 'Dé', bonus: 'Bonus', perDie: 'Par dé', perPool: 'Une fois par groupe', modifier: 'Modificateur du lancer entier', roll: 'Lancer', result: 'Résultat', history: 'Historique', repeat: 'Relancer', clear: 'Effacer l’historique', confirm: 'Effacer l’historique des lancers ?', cancel: 'Annuler', clearNow: 'Effacer', close: 'Fermer les dés', reroll: 'Relancer le dé', critical: 'Critique', phantom: 'Fantôme', noHistory: 'Les derniers lancers apparaîtront ici.', open: 'Ouvrir les dés' },
  'en-US': { title: 'Dice', quick: 'Quick roll', newRoll: 'New roll', group: 'Group', addGroup: 'Add dice group', removeGroup: 'Remove group', count: 'Number of dice', kind: 'Die', bonus: 'Bonus', perDie: 'Per die', perPool: 'Once per group', modifier: 'Whole-roll modifier', roll: 'Roll', result: 'Result', history: 'History', repeat: 'Repeat', clear: 'Clear history', confirm: 'Clear roll history?', cancel: 'Cancel', clearNow: 'Clear', close: 'Close dice', reroll: 'Reroll die', critical: 'Critical', phantom: 'Phantom', noHistory: 'Recent rolls will appear here.', open: 'Open dice' },
} as const;
export const diceText = copy[languageSettings.NEXT_LANGUAGE as keyof typeof copy] ?? copy['en-US'];
const poolNames: Record<string, DicePoolNames> = {
  'pl-PL': { leading: 'Broń główna', secondary: 'Broń dodatkowa', damage: 'Obrażenia', additional: 'Dodatkowe obrażenia', powerAttack: 'Atak mocy', powerDamage: 'Obrażenia mocy' },
  'de-DE': { leading: 'Hauptwaffe', secondary: 'Zweitwaffe', damage: 'Schaden', additional: 'Zusatzschaden', powerAttack: 'Kraftangriff', powerDamage: 'Kraftschaden' },
  'fr-FR': { leading: 'Arme principale', secondary: 'Arme secondaire', damage: 'Dégâts', additional: 'Dégâts supplémentaires', powerAttack: 'Attaque de pouvoir', powerDamage: 'Dégâts de pouvoir' },
  'en-US': { leading: 'Main weapon', secondary: 'Secondary weapon', damage: 'Damage', additional: 'Additional damage', powerAttack: 'Power attack', powerDamage: 'Power damage' },
};
export const dicePoolNames = poolNames[languageSettings.NEXT_LANGUAGE] ?? poolNames['en-US'];

type Props = {
  open: boolean;
  onClose: () => void;
  preset: RollPreset;
  onPresetChange: Dispatch<SetStateAction<RollPreset>>;
  latest: RollRecord | null;
  history: RollRecord[];
  onRoll: () => void;
  onReroll: (pool: number, die: number) => void;
  onRepeat: (record: RollRecord) => void;
  onClear: () => void;
  onNewRoll: () => void;
};

export default function DiceRollerPanel({ open, onClose, preset, onPresetChange, latest, history, onRoll, onReroll, onRepeat, onClear, onNewRoll }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const priorFocus = useRef<HTMLElement | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (open) { priorFocus.current = document.activeElement as HTMLElement; heading.current?.focus(); }
    else if (priorFocus.current?.isConnected) priorFocus.current.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open, onClose]);
  if (history.length === 0 && confirmClear) setConfirmClear(false);

  const updatePool = (index: number, patch: Partial<DicePool>) => onPresetChange(previous => ({
    ...previous,
    pools: previous.pools.map((pool, current) => current === index ? { ...pool, ...patch } : pool),
  }));
  const addPool = () => onPresetChange(previous => previous.pools.length >= maxDicePools ? previous : {
    ...previous,
    pools: [...previous.pools, { ...defaultRollPreset().pools[0] }],
  });
  const removePool = (index: number) => onPresetChange(previous => previous.pools.length === 1 ? previous : {
    ...previous,
    pools: previous.pools.filter((_, current) => current !== index),
  });

  return <div className="screen-only print:hidden">
    <aside className={`fixed inset-y-0 right-0 z-[1000] flex w-full flex-col border-l bg-background shadow-2xl transition-transform duration-200 motion-reduce:transition-none sm:w-[26rem] ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label={diceText.title} aria-hidden={!open} {...(!open ? { inert: true } : {})}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">{diceText.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={diceText.close}><X /></Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-24">
        <section className="space-y-3" aria-label={diceText.quick}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{preset.label || diceText.quick}</p>
            <Button variant="ghost" size="sm" onClick={onNewRoll}>{diceText.newRoll}</Button>
          </div>

          {preset.pools.map((pool, index) => <div key={index} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div><p className="font-medium">{pool.label || `${diceText.group} ${index + 1}`}</p><p className="font-mono text-sm text-muted-foreground">{formatDicePool(pool)}</p></div>
              <Button variant="ghost" size="sm" disabled={preset.pools.length === 1} aria-label={`${diceText.removeGroup} ${index + 1}`} onClick={() => removePool(index)}><X className="size-4" /></Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1 text-sm">{diceText.count}<Input type="number" min={0} max={15} value={pool.amount} onChange={e => {
                const amount = Number(e.target.value);
                updatePool(index, { amount, ...(amount > 0 && pool.grade === 0 ? { grade: 3 } : {}) });
              }} /></label>
              <label className="space-y-1 text-sm">{diceText.kind}<select className="flex h-9 w-full rounded-md border bg-background px-2" value={pool.grade} onChange={e => updatePool(index, { grade: Number(e.target.value) })}>
                {pool.grade === 0 && <option value={0}>—</option>}
                {Array.from({ length: 15 }, (_, grade) => <option key={grade} value={grade + 1}>k{(grade + 1) * 2}</option>)}
              </select></label>
              <label className="space-y-1 text-sm">{diceText.bonus}<Input type="number" value={pool.bonus} onChange={e => updatePool(index, { bonus: Number(e.target.value) })} /></label>
            </div>
            <select className="flex h-9 w-full rounded-md border bg-background px-2 text-sm" value={pool.bonusScope} aria-label={`${diceText.bonus}: ${pool.label || `${diceText.group} ${index + 1}`}`} onChange={e => updatePool(index, { bonusScope: e.target.value as DicePool['bonusScope'] })}>
              <option value="die">{diceText.perDie}</option><option value="pool">{diceText.perPool}</option>
            </select>
            {(pool.isPhantom || pool.critical) && <p className="text-xs text-muted-foreground">{pool.isPhantom ? diceText.phantom : ''}{pool.critical ? ` · ${diceText.critical}: ${pool.critical.range} / +${pool.critical.power}` : ''}</p>}
          </div>)}

          <Button variant="outline" className="w-full" disabled={preset.pools.length >= maxDicePools} onClick={addPool}>+ {diceText.addGroup}</Button>
          <label className="block space-y-1 text-sm">{diceText.modifier}<Input type="number" value={preset.modifier} onChange={e => onPresetChange(previous => ({ ...previous, modifier: Number(e.target.value) }))} /></label>
          <p className="break-words rounded-md bg-muted px-3 py-2 font-mono text-sm">{formatRollPreset(preset)}</p>
        </section>

        {latest && <section aria-live="polite" className="rounded-lg border bg-muted/50 p-4">
          <h3 className="text-sm font-medium">{diceText.result}</h3>
          <p className="text-4xl font-bold tabular-nums">{latest.total}</p>
          <p className="mt-1 break-words font-mono text-sm">{formatRollPreset(latest.preset)} = {latest.total}</p>
          <div className="mt-3 space-y-2">{latest.preset.pools.map((pool, poolIndex) => <div key={poolIndex} className="flex flex-wrap items-center gap-1 text-sm">
            <span>{pool.label || `${diceText.group} ${poolIndex + 1}`}:</span>
            {latest.dice[poolIndex]?.map((die, dieIndex) => <button key={dieIndex} type="button" className={`rounded border px-2 py-1 tabular-nums hover:bg-accent ${die.critical ? 'border-amber-500 font-bold' : ''}`} onClick={() => onReroll(poolIndex, dieIndex)} aria-label={`${diceText.reroll} ${dieIndex + 1}: ${die.value}${die.critical ? `, ${diceText.critical}` : ''}`} title={diceText.reroll}>{die.value}{die.critical ? ' ★' : ''}</button>)}
            {pool.bonus !== 0 && <span>{pool.bonusScope === 'die' ? `${pool.bonus >= 0 ? '+' : ''}${pool.bonus} × ${pool.amount}` : `${pool.bonus >= 0 ? '+' : ''}${pool.bonus}`}</span>}
          </div>)}{latest.preset.modifier !== 0 && <p>{diceText.modifier}: {latest.preset.modifier >= 0 ? '+' : ''}{latest.preset.modifier}</p>}</div>
        </section>}

        <section>
          <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-semibold">{diceText.history}</h3>{history.length > 0 && <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>{diceText.clear}</Button>}</div>
          {confirmClear && <div className="mb-3 rounded-md border p-3 text-sm"><p>{diceText.confirm}</p><div className="mt-2 flex gap-2"><Button variant="destructive" size="sm" onClick={() => { onClear(); setConfirmClear(false); }}>{diceText.clearNow}</Button><Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>{diceText.cancel}</Button></div></div>}
          {history.length === 0 ? <p className="text-sm text-muted-foreground">{diceText.noHistory}</p> : <ol className="space-y-2">{history.map(item => <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <span><strong>{item.total}</strong> · {item.preset.label || diceText.quick}<br /><span className="text-muted-foreground">{formatRollPreset(item.preset)} [{item.dice.flat().map(die => die.value).join(', ')}] · {new Date(item.timestamp).toLocaleTimeString(languageSettings.NEXT_LANGUAGE)}</span></span>
            <Button variant="outline" size="sm" onClick={() => onRepeat(item)}>{diceText.repeat}</Button>
          </li>)}</ol>}
        </section>
      </div>

      <div className="sticky bottom-0 border-t bg-background p-4"><Button className="h-12 w-full text-lg" onClick={onRoll} disabled={!validateRollPreset(preset)}>{diceText.roll}</Button></div>
    </aside>
  </div>;
}
