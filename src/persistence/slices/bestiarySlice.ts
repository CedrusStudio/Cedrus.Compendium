import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BestiarySliceState = 
{
  addedToBattle: string[];
};

const initialState: BestiarySliceState = 
{
  addedToBattle: [] 
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
    },
    removeSelectedFromBattle(state, action: PayloadAction<string[]>) 
    {
      const toRemove = new Set(action.payload);
      state.addedToBattle = state.addedToBattle.filter(id => !toRemove.has(id));
    },
    clearBattle(state) {
      state.addedToBattle = [];
    },
  },
});

export const { actions, reducer } = bestiarySlice;