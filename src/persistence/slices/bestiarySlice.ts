import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExternalParticipant } from '@/application/bestiary/battle/ExternalParticipant';

const BATTLE_STORAGE_KEY = 'charactersInBattle';
const INITIATIVES_STORAGE_KEY = 'battleInitiatives';
const EXTERNAL_PARTICIPANTS_STORAGE_KEY = 'externalParticipants';

export type InitiativeEntry = 
{
  initiative: number | null;
};

// Helper to load characters from session storage
const loadCharactersFromSessionStorage = (): string[] => 
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

// Helper to load initiatives from session storage
const loadInitiativesFromSessionStorage = (): Record<string, InitiativeEntry> => 
{
  if (typeof window === 'undefined') return {};
  const stored = sessionStorage.getItem(INITIATIVES_STORAGE_KEY);
  if (!stored) return {};
  
  try 
  {
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } 
  catch 
  {
    return {};
  }
};

// Helper to save characters to session storage
const saveCharactersToSessionStorage = (ids: string[]) => 
{
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(BATTLE_STORAGE_KEY, JSON.stringify(ids));
};

// Helper to save initiatives to session storage
const saveInitiativesToSessionStorage = (initiatives: Record<string, InitiativeEntry>) => 
{
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(INITIATIVES_STORAGE_KEY, JSON.stringify(initiatives));
};

// Helper to load external participants from session storage
const loadExternalParticipantsFromSessionStorage = (): ExternalParticipant[] => 
{
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(EXTERNAL_PARTICIPANTS_STORAGE_KEY);
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

// Helper to save external participants to session storage
const saveExternalParticipantsToSessionStorage = (participants: ExternalParticipant[]) => 
{
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EXTERNAL_PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants));
};

export type BestiarySliceState = 
{
  addedToBattle: string[];
  initiatives: Record<string, InitiativeEntry>;
  externalParticipants: ExternalParticipant[];
};

const initialState: BestiarySliceState = 
{
  addedToBattle: loadCharactersFromSessionStorage(),
  initiatives: loadInitiativesFromSessionStorage(),
  externalParticipants: loadExternalParticipantsFromSessionStorage()
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
      saveCharactersToSessionStorage(state.addedToBattle);
    },
    removeSelectedFromBattle(state, action: PayloadAction<string[]>) 
    {
      const toRemove = new Set(action.payload);
      state.addedToBattle = state.addedToBattle.filter(id => !toRemove.has(id));
      // Remove initiatives for removed characters
      for (const id of action.payload) 
      {
        delete state.initiatives[id];
      }
      saveCharactersToSessionStorage(state.addedToBattle);
      saveInitiativesToSessionStorage(state.initiatives);
    },
    clearBattle(state) 
    {
      state.addedToBattle = [];
      state.initiatives = {};
      saveCharactersToSessionStorage(state.addedToBattle);
      saveInitiativesToSessionStorage(state.initiatives);
    },
    setInitiative(state, action: PayloadAction<{ characterId: string; initiative: number | null; }>) 
    {
      const { characterId, initiative } = action.payload;
      state.initiatives[characterId] = { initiative };
      saveInitiativesToSessionStorage(state.initiatives);
    },
    rollInitiativeForCharacter(state, action: PayloadAction<{ characterId: string; rollResult: number }>) 
    {
      const { characterId, rollResult } = action.payload;
      state.initiatives[characterId] = { initiative: rollResult };
      saveInitiativesToSessionStorage(state.initiatives);
    },
    clearInitiatives(state) 
    {
      state.initiatives = {};
      saveInitiativesToSessionStorage(state.initiatives);
    },
    removeInitiativeForCharacter(state, action: PayloadAction<string>) 
    {
      delete state.initiatives[action.payload];
      saveInitiativesToSessionStorage(state.initiatives);
    },
    addExternalParticipant(state, action: PayloadAction<ExternalParticipant>) 
    {
      state.externalParticipants.push(action.payload);
      saveExternalParticipantsToSessionStorage(state.externalParticipants);
    },
    updateExternalParticipant(state, action: PayloadAction<ExternalParticipant>) 
    {
      const index = state.externalParticipants.findIndex(p => p.id === action.payload.id);
      if (index !== -1) 
      {
        state.externalParticipants[index] = action.payload;
        saveExternalParticipantsToSessionStorage(state.externalParticipants);
      }
    },
    removeExternalParticipant(state, action: PayloadAction<string>) 
    {
      state.externalParticipants = state.externalParticipants.filter(p => p.id !== action.payload);
      delete state.initiatives[action.payload];
      saveExternalParticipantsToSessionStorage(state.externalParticipants);
      saveInitiativesToSessionStorage(state.initiatives);
    },
  },
});

export const { actions, reducer } = bestiarySlice;