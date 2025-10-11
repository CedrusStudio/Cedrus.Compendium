import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CharacterSliceState = 
{
  characterNavbarSearch: string;
  characterShortNameMapping: IdToShortNameMapping;
};

type IdToShortNameMapping = Record<string, string>;

const initialState: CharacterSliceState = 
{
    characterNavbarSearch: '',
    characterShortNameMapping: {}
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
    },
    setCharacterShortName(state, action: PayloadAction<{ id: string, shortName: string }>) 
    {
      state.characterShortNameMapping[action.payload.id] = action.payload.shortName;
    },
    clearCharacterShortName(state) 
    {
      state.characterShortNameMapping = {};
    }
  },
});

export const { actions, reducer } = characterSlice;