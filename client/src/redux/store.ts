import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import dashboardUiReducer from './slices/dashboardUiSlice';

const store = configureStore({
  reducer: {
    theme: themeReducer,
    dashboardUi: dashboardUiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
