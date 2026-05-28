import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeState = {
  activeTheme: number;
};

const initialState: ThemeState = {
  activeTheme: 0,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<number>) {
      state.activeTheme = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
