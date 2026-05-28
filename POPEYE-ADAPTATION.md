# PopeyeBalluta → NomadMee Adaptation Plan

## What I found in PopeyeBalluta
- The app uses `react-redux` with a centralized store in `frontend/src/redux/store.js`.
- `themeSlice.js` holds a selected theme index, and the UI updates color values dynamically based on that state.
- The home screen is a two-panel layout:
  - Left side: interactive buttons for journey, character, speed, and theme selection.
  - Right side: map + progress controls that update based on left-side button state.
- The button state is handled through Redux for theme selection and local component state for journey/character controls.
- The gamified layout is blocky, with big squares, bright accent colors, and a clear action area.
- The map component and progress bar are the main output area for the selected actions.
- On mobile the layout should collapse so controls move to the top and the canvas area is below.

## How this matches NomadMee
- NomadMee already has the business logic for investors:
  - investor login
  - investor home data fetch
  - investment summary
  - assigned cargos
  - admin cargo/investor management
- We can keep the same NomadMee logic and data flows.
- We should keep the two-step separation: business logic in `backend/src/routes/portal.ts` and `client/src/api/portalApi.ts`, UI logic in the new frontend layout.

## Proposed adaptation approach
1. Keep NomadMee backend and portal API as-is.
2. Add a Redux store to NomadMee for UI state:
   - `themeSlice` for theme selection
   - `dashboardUiSlice` for active panel/tab state
   - optional `notificationSlice` or `userUiSlice` for hover/selection effects
3. Replace `client/src/views/investorHome.tsx` with a gamified dashboard layout:
   - left panel: buttons/tabs for `Investment`, `Cargo map`, `Shipment details`, `Performance`
   - right panel: content area showing the selected view
   - mobile: move tabs to the top and stack content vertically
4. Use PopeyeBalluta-style dynamic color themes for branding:
   - create a `theme.ts` with theme palettes like PopeyeBalluta
   - apply via styled-components or CSS variables
   - theme switch changes accent colors in the dashboard cards and buttons
5. Preserve current investor data flow:
   - `getInvestorHome()` remains the source of investor summary and cargo list
   - `logoutInvestor()` remains the same
   - the right panel can show details from `data.cargos` and `data.investor`

## Recommended gamified investor layout
- Left button column (or top mobile tabs):
  - `Summary`
  - `Cargos`
  - `Map`
  - `Investment story`
  - `Support`
- Right panel content for each button:
  - `Summary`: KPI cards, projected profit, payout, ROI
  - `Cargos`: cargo cards with purchase, shipping, ETA, destination
  - `Map`: location marker or route map for a selected cargo
  - `Investment story`: simple progress timeline / status badges
  - `Support`: quick actions and contact CTA
- Add theme selector buttons like PopeyeBalluta to change colors.
- Use large clickable squares and bright accent outlines for a youth-friendly gamified feel.

## Why this works
- It preserves NomadMee’s existing investor and admin business logic.
- It leverages PopeyeBalluta’s interaction pattern: choose an action on the left, see the result on the right.
- It aligns with `UI-UX-PLAN.md` by adding:
  - a more visual dashboard
  - clear investor-focused actions
  - gamified selection buttons with color themes
  - mobile-first tab reflow

## Database relation architecture
- `Cargo` now includes a `currency` field and represents a shipment item.
- `Investment` stores its `cargoIds` explicitly and tracks which investors are assigned via `assignedInvestorIds`.
- `Investor` keeps assigned investments in `assignedInvestmentIds` and derives assigned cargos through those investments.
- This means cargo assignment is moved to the investment layer instead of directly assigning cargos to investors.
- Admin flows now:
  - create cargos with currency
  - create investments and attach cargos to those investments
  - assign investors to investments
  - investor-facing cargo lists are derived from the investor’s assigned investments

## Next step
- I can implement a new Redux-powered investor dashboard in `NomadMee/client/src/views/investorHome.tsx`.
- I can also add a `theme.ts` palette and a small UI state slice to switch between panels.
- If you want, I can start with a concrete `investorHome` redesign and a new Redux setup.
