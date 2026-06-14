import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GlobeLayer = 'all' | 'trade' | 'investments' | 'shop' | 'community' | 'journeys';

export type GlobeLayerState = {
  activeLayer: GlobeLayer;
};

const initialState: GlobeLayerState = {
  activeLayer: 'all',
};

const globeLayerSlice = createSlice({
  name: 'globeLayer',
  initialState,
  reducers: {
    setGlobeLayer(state, action: PayloadAction<GlobeLayer>) {
      state.activeLayer = action.payload;
    },
  },
});

export const { setGlobeLayer } = globeLayerSlice.actions;
export default globeLayerSlice.reducer;
