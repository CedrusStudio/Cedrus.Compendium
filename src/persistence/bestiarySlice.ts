import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BestiarySliceState = 
{
  bestiaryNavbarSearch: string;
};

const initialState: BestiarySliceState = 
{
    bestiaryNavbarSearch: '' 
};

const bestiarySlice = createSlice
({
  name: 'bestiary',
  initialState,
  reducers: 
  {
    setBestiaryNavbarSearch(state, action: PayloadAction<string>) 
    {
      state.bestiaryNavbarSearch = action.payload;
    },
    clearBestiaryNavbarSearch(state) 
    {
      state.bestiaryNavbarSearch = '';
    }
  },
});

export const { actions, reducer } = bestiarySlice;