import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const BATTLE_STORAGE_KEY = 'charactersInBattle';

// Helper to load from session storage
const loadFromSessionStorage = (): string[] => 
{
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(BATTLE_STORAGE_KEY);
  if (!stored) return [];
  try 
  {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } 
  catch 
  {
    return [];
  }
};

// Helper to save to session storage
const saveToSessionStorage = (ids: string[]) => 
{
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(ids));
};

export type BestiarySliceState = 
{
  addedToBattle: string[];
};

const initialState: BestiarySliceState = 
{
  addedToBattle: loadFromSessionStorage()
};

const bestiarySlice = createSlice
({
  name: 'bestiary',
  initialState,
  reducers: 
  {
    addSelectedToBattle(state, action: PayloadAction<string[]>) 
    {
      const set = new Set(state.addedToBattle);
      for (const id of action.payload) set.add(id);
      state.addedToBattle = Array.from(set);
      saveToSessionStorage(state.addedToBattle);
    },
    removeSelectedFromBattle(state, action: PayloadAction<string[]>) 
    {
      const toRemove = new Set(action.payload);
      state.addedToBattle = state.addedToBattle.filter(id => !toRemove.has(id));
      saveToSessionStorage(state.addedToBattle);
    },
    clearBattle(state) {
      state.addedToBattle = [];
      saveToSessionStorage(state.addedToBattle);
    },
  },
});

export const { actions, reducer } = bestiarySlice;