'use client';

import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { defaultRollPreset, executeRoll, rerollDie, type RollPreset, type RollRecord } from '@/domain/diceRoller';
import DiceRollerPanel from './DiceRollerPanel';

type DiceRollerContext = {
  open: (preset?: RollPreset) => void;
  close: () => void;
  record: (roll: RollRecord) => void;
  history: RollRecord[];
};
const Context = createContext<DiceRollerContext | null>(null);
export const useOptionalDiceRoller = () => useContext(Context);
export function useDiceRoller() {
  const context = useContext(Context);
  if (!context) throw new Error('DiceRollerProvider is missing');
  return context;
}

export default function DiceRollerProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<RollPreset>(defaultRollPreset);
  const [history, setHistory] = useState<RollRecord[]>([]);
  const [latest, setLatest] = useState<RollRecord | null>(null);
  const record = useCallback((roll: RollRecord) => {
    setLatest(roll);
    setHistory(previous => [roll, ...previous].slice(0, 20));
  }, []);
  const open = (next?: RollPreset) => {
    if (next) { setPreset(structuredClone(next)); setLatest(null); }
    setIsOpen(true);
  };
  const doRoll = () => record(executeRoll(preset));
  const doReroll = (poolIndex: number, dieIndex: number) => {
    if (latest) record(rerollDie(latest, poolIndex, dieIndex));
  };
  return <Context.Provider value={{ open, close: () => setIsOpen(false), record, history }}>
    {children}
    <DiceRollerPanel
      open={isOpen} onClose={() => setIsOpen(false)} preset={preset} onPresetChange={setPreset}
      latest={latest} history={history} onRoll={doRoll} onReroll={doReroll}
      onRepeat={old => { setPreset(structuredClone(old.preset)); record(executeRoll(old.preset)); }}
      onClear={() => { setHistory([]); setLatest(null); }}
      onNewRoll={() => { setPreset(defaultRollPreset()); setLatest(null); }}
    />
  </Context.Provider>;
}
