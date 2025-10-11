import { configureStore } from '@reduxjs/toolkit';
import { reducer as characterReducer } from '@/persistence/slices/characterSlice';
import { reducer as bestiaryReducer } from '@/persistence/slices/bestiarySlice';

export const store = configureStore
({
  reducer: {
    character: characterReducer,
    bestiary: bestiaryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;