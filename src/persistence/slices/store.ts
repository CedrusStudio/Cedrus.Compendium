import { configureStore } from '@reduxjs/toolkit';
import { reducer as characterReducer } from '@/persistence/slices/characterSlice';
import { reducer as bestiaryReducer } from '@/persistence/slices/bestiarySlice';
import { reducer as personalizationReducer } from '@/persistence/slices/personalizationSlice';

export const store = configureStore
({
  reducer: {
    character: characterReducer,
    bestiary: bestiaryReducer,
    personalization: personalizationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;