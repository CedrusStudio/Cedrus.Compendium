import { configureStore } from '@reduxjs/toolkit';
import { reducer as characterReducer } from '@/persistence/characterSlice';
import { reducer as bestiaryReducer } from '@/persistence/bestiarySlice';

export const store = configureStore
({
  reducer: {
    character: characterReducer,
    bestiary: bestiaryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;