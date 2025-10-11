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
      state.addedToBattle.push(...action.payload);
    },
    removeSelectedFromBattle(state, action: PayloadAction<string[]>) 
    {
      state.addedToBattle = state.addedToBattle.filter(id => !action.payload.includes(id));
    }
  },
});

export const { actions, reducer } = bestiarySlice;