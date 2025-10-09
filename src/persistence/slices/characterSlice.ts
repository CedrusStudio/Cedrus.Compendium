import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CharacterSliceState = 
{
  characterNavbarSearch: string;
};

const initialState: CharacterSliceState = 
{
    characterNavbarSearch: '' 
};

const characterSlice = createSlice
({
  name: 'character',
  initialState,
  reducers: 
  {
    setCharacterNavbarSearch(state, action: PayloadAction<string>) 
    {
      state.characterNavbarSearch = action.payload;
    },
    clearCharacterNavbarSearch(state) 
    {
      state.characterNavbarSearch = '';
    }
  },
});

export const { actions, reducer } = characterSlice;