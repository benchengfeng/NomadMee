import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PanelId = 'summary' | 'cargos' | 'map' | 'story' | 'support' | 'settings';

export type DashboardUiState = {
  activePanel: PanelId;
  selectedCargoId: string | null;
};

const initialState: DashboardUiState = {
  activePanel: 'summary',
  selectedCargoId: null,
};

const dashboardUiSlice = createSlice({
  name: 'dashboardUi',
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<PanelId>) {
      state.activePanel = action.payload;
    },
    setSelectedCargoId(state, action: PayloadAction<string | null>) {
      state.selectedCargoId = action.payload;
    },
  },
});

export const { setActivePanel, setSelectedCargoId } = dashboardUiSlice.actions;
export default dashboardUiSlice.reducer;
