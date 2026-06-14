import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import dashboardUiReducer from './slices/dashboardUiSlice';
import globeLayerReducer from './slices/globeLayerSlice';

const store = configureStore({
  reducer: {
    theme: themeReducer,
    dashboardUi: dashboardUiReducer,
    globeLayer: globeLayerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
