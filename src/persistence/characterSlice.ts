import { createSlice } from '@reduxjs/toolkit';

export type CharacterSliceState = 
{
  currentCharacterId: string;
};

const initialState: CharacterSliceState = 
{
    currentCharacterId: ''
};

const characterSlice = createSlice
({
  name: 'character',
  initialState,
  reducers: {
    },
});

export const { actions, reducer } = characterSlice;