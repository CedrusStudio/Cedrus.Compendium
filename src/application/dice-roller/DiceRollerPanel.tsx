'use client';

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { languageSettings } from '@/lib/env';
import { defaultRollPreset, validateRollPreset, type DicePoolNames, type RollPreset, type RollRecord } from '@/domain/diceRoller';
import { X } from 'lucide-react';

const copy = {
  'pl-PL': { title: 'Kości', quick: 'Szybki rzut', newRoll: 'Nowy rzut', count: 'Liczba kości', kind: 'Kość', modifier: 'Modyfikator', roll: 'Rzuć', result: 'Wynik', history: 'Historia', repeat: 'Powtórz', clear: 'Wyczyść historię', confirm: 'Wyczyścić historię rzutów?', close: 'Zamknij kości', reroll: 'Przerzuć kość', critical: 'Krytyk', phantom: 'Widmowa', noHistory: 'Tutaj pojawią się ostatnie rzuty.', open: 'Otwórz kości' },
  'de-DE': { title: 'Würfel', quick: 'Schneller Wurf', newRoll: 'Neuer Wurf', count: 'Anzahl Würfel', kind: 'Würfel', modifier: 'Modifikator', roll: 'Würfeln', result: 'Ergebnis', history: 'Verlauf', repeat: 'Wiederholen', clear: 'Verlauf löschen', confirm: 'Wurfverlauf löschen?', close: 'Würfel schließen', reroll: 'Würfel erneut werfen', critical: 'Kritisch', phantom: 'Phantom', noHistory: 'Die letzten Würfe erscheinen hier.', open: 'Würfel öffnen' },
  'fr-FR': { title: 'Dés', quick: 'Lancer rapide', newRoll: 'Nouveau lancer', count: 'Nombre de dés', kind: 'Dé', modifier: 'Modificateur', roll: 'Lancer', result: 'Résultat', history: 'Historique', repeat: 'Relancer', clear: 'Effacer l’historique', confirm: 'Effacer l’historique des lancers ?', close: 'Fermer les dés', reroll: 'Relancer le dé', critical: 'Critique', phantom: 'Fantôme', noHistory: 'Les derniers lancers apparaîtront ici.', open: 'Ouvrir les dés' },
  'en-US': { title: 'Dice', quick: 'Quick roll', newRoll: 'New roll', count: 'Number of dice', kind: 'Die', modifier: 'Modifier', roll: 'Roll', result: 'Result', history: 'History', repeat: 'Repeat', clear: 'Clear history', confirm: 'Clear roll history?', close: 'Close dice', reroll: 'Reroll die', critical: 'Critical', phantom: 'Phantom', noHistory: 'Recent rolls will appear here.', open: 'Open dice' },
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
};

export default function DiceRollerPanel({ open, onClose, preset, onPresetChange, latest, history, onRoll, onReroll, onRepeat, onClear }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const priorFocus = useRef<HTMLElement | null>(null);
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
  const change = (field: 'amount' | 'grade' | 'modifier', value: number) => onPresetChange(previous => field === 'modifier'
    ? { ...previous, modifier: value }
    : { ...previous, pools: previous.pools.map((pool, index) => index === 0 ? { ...pool, [field]: value } : pool) });
  const simple = preset.pools.length === 1 && !preset.pools[0].critical;

  return <div className="screen-only print:hidden">
    <aside className={`fixed inset-y-0 right-0 z-[1000] flex w-full flex-col border-l bg-background shadow-2xl transition-transform duration-200 motion-reduce:transition-none sm:w-[26rem] ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label={diceText.title} aria-hidden={!open} {...(!open ? { inert: true } : {})}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold outline-none">{diceText.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={diceText.close}><X /></Button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4 pb-24">
        <section className="space-y-3" aria-label={diceText.quick}>
          <div className="flex items-center justify-between gap-2"><p className="font-medium">{preset.label || diceText.quick}</p><Button variant="ghost" size="sm" onClick={() => onPresetChange(defaultRollPreset())}>{diceText.newRoll}</Button></div>
          {simple ? <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1 text-sm">{diceText.count}<Input type="number" min={0} max={15} value={preset.pools[0].amount} onChange={e => change('amount', Number(e.target.value))} /></label>
            <label className="space-y-1 text-sm">{diceText.kind}<select className="flex h-9 w-full rounded-md border bg-background px-2" value={preset.pools[0].grade} onChange={e => change('grade', Number(e.target.value))}>{Array.from({ length: 15 }, (_, index) => <option key={index} value={index + 1}>k{(index + 1) * 2}</option>)}</select></label>
            <label className="space-y-1 text-sm">{diceText.modifier}<Input type="number" value={preset.modifier + preset.pools[0].bonus} onChange={e => onPresetChange(previous => ({ ...previous, modifier: Number(e.target.value) - previous.pools[0].bonus }))} /></label>
          </div> : <div className="space-y-2 text-sm">{preset.pools.map((pool, index) => <div key={index} className="rounded-md border p-2"><strong>{pool.label}</strong>: {pool.amount}k{pool.grade * 2} {pool.bonus >= 0 ? '+' : ''}{pool.bonus} {pool.isPhantom ? `· ${diceText.phantom}` : ''}{pool.critical ? ` · ${diceText.critical}: ${pool.critical.range} / +${pool.critical.power}` : ''}</div>)}<label className="block">{diceText.modifier}<Input type="number" value={preset.modifier} onChange={e => change('modifier', Number(e.target.value))} /></label></div>}
        </section>
        {latest && <section aria-live="polite" className="rounded-lg border bg-muted/50 p-4"><h3 className="text-sm font-medium">{diceText.result}</h3><p className="text-4xl font-bold tabular-nums">{latest.total}</p><div className="mt-2 space-y-2">{latest.preset.pools.map((pool, poolIndex) => <div key={poolIndex} className="flex flex-wrap items-center gap-1 text-sm"><span>{pool.label || `${pool.amount}k${pool.grade * 2}`}:</span>{latest.dice[poolIndex]?.map((die, dieIndex) => <button key={dieIndex} type="button" className={`rounded border px-2 py-1 tabular-nums hover:bg-accent ${die.critical ? 'border-amber-500 font-bold' : ''}`} onClick={() => onReroll(poolIndex, dieIndex)} aria-label={`${diceText.reroll} ${dieIndex + 1}: ${die.value}${die.critical ? `, ${diceText.critical}` : ''}`} title={diceText.reroll}>{die.value}{die.critical ? ' ★' : ''}</button>)}{pool.bonus !== 0 && <span>{pool.bonusScope === 'die' ? `${pool.bonus >= 0 ? '+' : ''}${pool.bonus} × ${pool.amount}` : `${pool.bonus >= 0 ? '+' : ''}${pool.bonus}`}</span>}</div>)}{latest.preset.modifier !== 0 && <p>{diceText.modifier}: {latest.preset.modifier >= 0 ? '+' : ''}{latest.preset.modifier}</p>}</div></section>}
        <section><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">{diceText.history}</h3>{history.length > 0 && <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(diceText.confirm)) onClear(); }}>{diceText.clear}</Button>}</div>{history.length === 0 ? <p className="text-sm text-muted-foreground">{diceText.noHistory}</p> : <ol className="space-y-2">{history.map(item => <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"><span><strong>{item.total}</strong> · {item.preset.label || diceText.quick}<br /><span className="text-muted-foreground">{item.preset.pools.map((pool, index) => `${pool.amount}k${pool.grade * 2} [${item.dice[index]?.map(die => die.value).join(', ') ?? ''}]`).join(' + ')} · {new Date(item.timestamp).toLocaleTimeString(languageSettings.NEXT_LANGUAGE)}</span></span><Button variant="outline" size="sm" onClick={() => onRepeat(item)}>{diceText.repeat}</Button></li>)}</ol>}</section>
      </div>
      <div className="sticky bottom-0 border-t bg-background p-4"><Button className="h-12 w-full text-lg" onClick={onRoll} disabled={!validateRollPreset(preset)}>{diceText.roll}</Button></div>
    </aside>
  </div>;
}
