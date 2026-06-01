# NomadMee — Improvement Suggestions

Each item is scoped small. Grouped by area: Security & Reliability first, then UX/First Impression, then Admin Quality of Life, then Polish.

---

## 1. Security & Reliability (Ship blockers)

### 1.1 — Plain-text passwords in MongoDB
**Problem:** Investor passwords are stored and compared as literal strings. A DB leak = all credentials exposed.  
**Fix:** Add `bcrypt` to the backend. Hash on `POST /admin/investors` creation and `PUT /admin/investors/:id` update. Compare with `bcrypt.compare()` on login. One-time migration: re-set all passwords via admin after deploy.  
**Effort:** ~1 hour.

### 1.2 — Hardcoded admin credentials in source code
**Problem:** `ADMIN_USERNAME = 'admin'` and `ADMIN_PASSWORD = 'admin112233'` are in `portal.ts`, committed to git.  
**Fix:** Move both to `process.env.ADMIN_USERNAME` and `process.env.ADMIN_PASSWORD`. Already have a `.env` file and CI secrets — just add two more vars.  
**Effort:** 15 minutes.

### 1.3 — In-memory token storage
**Problem:** `adminTokens` and `investorTokens` are plain JS `Map` objects. Every server restart (deploy, crash, systemd reload) invalidates all active sessions. Investors get silently kicked out.  
**Fix:** Persist tokens in MongoDB — a lightweight `Session` collection with `{ token, userId, role, createdAt }` + a TTL index (e.g., 7 days) for auto-expiry. Read from DB on each authenticated request. A 5-line model + a 5-line lookup change.  
**Effort:** ~2 hours.

### 1.4 — No rate limiting on login endpoints
**Problem:** `/investor/login` and `/admin/login` accept unlimited attempts. Brute-force a 6-char password in seconds.  
**Fix:** Add `express-rate-limit` — 10 attempts per 15 min per IP on login routes only. Tiny package, 5 lines of config.  
**Effort:** 20 minutes.

---

## 2. First Impression & Investor UX

### 2.1 — Investor login page has no path back to landing
**Problem:** A visitor who lands on `/login` via direct link sees only the login form with no navigation back to the public landing page. Feels like a dead end.  
**Fix:** Add a small "← Back to home" link (same style as `join-back-btn`) to the top-left of the investor login page.  
**Effort:** 10 minutes.

### 2.2 — Landing investments section: no skeleton while loading
**Problem:** Clicking "Investments" in the nav shows a blank dark area for 1–2s while the fetch resolves. Looks broken.  
**Fix:** Show 3 shimmering placeholder cards (CSS `animation: shimmer`) while `investments.length === 0` and before the fetch completes. Use a separate `loadingInvestments` boolean.  
**Effort:** 30 minutes.

### 2.3 — ETA progress bar on cargo cards (investor dashboard)
**Problem:** Cargo cards in the "Cargos" panel show only an ETA date. The investor has no visual sense of where in the journey the cargo is right now.  
**Fix:** Add a thin progress bar below the cargo card footer. Calculate `progress = (now - createdAt) / (ETA - createdAt)`, clamp 0–1, render as a colored bar with the percentage. Same logic already used in `CargoMap.tsx` for the jump-to-location button — reuse it.  
**Effort:** 45 minutes.

### 2.4 — "Portfolio Explorer" tier is always hardcoded
**Problem:** The hero card in the Summary panel always shows "Portfolio Explorer" as the investor tier, with no logic behind it. Feels fake and breaks immersion.  
**Fix Option A (easy):** Remove the tier label entirely — just show the investor name large.  
**Fix Option B (small feature):** Derive tier from `investmentAmount` converted to USD. Example thresholds: < 5,000 = "Emerging Partner", 5k–25k = "Portfolio Explorer", 25k–100k = "Senior Partner", > 100k = "Lead Investor". Purely frontend logic, no backend change.  
**Effort:** 20 minutes.

### 2.5 — Support panel links to the wrong contact page
**Problem:** The "Contact support" button in the investor dashboard links to `/contact`, which is the old legacy marketing page (a different visual style, no context of their investment). Confusing and jarring.  
**Fix:** Replace the link target. Either point to `/join` (choose an investment to contact about) or open a `mailto:` with a pre-filled subject like `Support request — @${investor.username}`. No backend changes needed.  
**Effort:** 10 minutes.

### 2.6 — No success/error toast system
**Problem:** Admin operations (save cargo, delete investor, update content) either silently succeed or show an error at the very top of the page — requiring a scroll up to notice. Investor settings save shows `✓ Saved!` on the button, which is fine, but admin has no equivalent feedback.  
**Fix:** A simple CSS-animated toast div fixed at the bottom-right. One `showToast(message, 'success' | 'error')` function using a short `useState` + `setTimeout` to auto-dismiss. No library needed — ~40 lines of CSS + 20 lines of logic.  
**Effort:** 1 hour.

### 2.7 — `window.confirm()` for delete actions
**Problem:** Cargo/investor/investment deletions use the native browser `window.confirm()` modal. It's styled by the OS, breaks the dark gamified aesthetic, and feels like a prototype.  
**Fix:** Replace with an inline confirm row that appears in place of the item's action buttons: "Are you sure? [Delete] [Cancel]". No modal overlay needed — just inline state `confirmDeleteId`.  
**Effort:** 45 minutes.

---

## 3. Admin Quality of Life

### 3.1 — Unsaved-changes warning when switching admin sections
**Problem:** If an admin is mid-way through editing a cargo and clicks "Investments" in the nav, the form data is silently lost. No warning.  
**Fix:** Track a `hasUnsavedChanges` boolean (true when any form field differs from initial state). On tab switch, if true, show a small inline warning: "You have unsaved changes — continue?" with Discard / Stay buttons. Pure frontend state, no backend.  
**Effort:** 45 minutes.

### 3.2 — Admin search/filter on cargo and investor lists
**Problem:** When there are 20+ cargos or investors, the list becomes a scroll wall. No way to find a specific item quickly.  
**Fix:** Add a single search input above each list panel. Filter client-side on `productBeingShipped` for cargos, `name` or `username` for investors. No backend change — data is already loaded.  
**Effort:** 30 minutes.

### 3.3 — Admin: cargo list shows no link to view in investor preview
**Problem:** Admin creates a cargo with a story and photos but can't preview how it looks in the investor dashboard without logging out and switching accounts.  
**Fix:** Add a small "Preview story" button on each cargo item that opens a modal with `StoryMediaGallery` + the description rendered exactly as investors see it. Reuse the existing component — zero backend work.  
**Effort:** 45 minutes.

### 3.4 — Admin: investor list shows amount in original currency, not normalized
**Problem:** The investor list shows raw `investmentAmount` + `currency` per investor, making it hard to compare: "20,000 TND" vs "5,000 USD" — which is bigger?  
**Fix:** Add a "(≈ $X)" annotation computed via the same `convertCurrency()` utility already in the frontend. Small label in gray next to the value. Admin can immediately see relative size.  
**Effort:** 20 minutes.

### 3.5 — Contact requests: auto-mark as "read" on expand
**Problem:** Admin has to manually click "Mark as read" after expanding a contact card. Adds friction and means the red badge count doesn't clear naturally.  
**Fix:** When a card is expanded (`setExpandedContactId`), if its status is `'new'`, automatically call `markStatus('read')`. Same as how email clients work.  
**Effort:** 10 minutes.

### 3.6 — Admin: Relations tab has no quick-assign shortcut
**Problem:** Seeing "No investors assigned" for an investment in the Relations tab is informative, but fixing it requires navigating to a completely different tab (Investors) and re-filling the form.  
**Fix:** Add a small "Assign investor →" button on each relation card that navigates to the Investors tab and pre-selects that investment in the form filter. Just `setActiveSection('investors')` + `setInvestorFormInvestmentFilter(inv._id)`. No backend change.  
**Effort:** 30 minutes.

---

## 4. Data Integrity

### 4.1 — `estimatedROI` stored field diverges from computed value
**Problem:** `estimatedROI` is stored in the DB as `investmentAmount * profitPercentage / 100`. But in the investor dashboard, the code re-derives it from the live values anyway — the stored field is unused. If an admin edits profit percentage, the stored `estimatedROI` is stale until re-saved.  
**Fix:** Either (a) remove the field entirely and always compute it dynamically (frontend already does this), or (b) make the backend always recalculate it before save (it already does on create/update — the investor home just doesn't use the stored value). Option (a) is cleaner.  
**Effort:** 30 minutes.

### 4.2 — Orphaned uploaded files on cargo/site content delete
**Problem:** When a cargo is deleted, its `story.mediaUrls` point to files in the `uploads/` directory that are never cleaned up. Over time, the uploads folder grows with orphaned files.  
**Fix:** In `DELETE /admin/cargos/:id`, after finding the cargo, read its `story.mediaUrls`, extract filenames, and call `fs.unlink()` on each. Same in `PUT /admin/site-content/:key` — diff old vs new mediaUrls and delete removed ones.  
**Effort:** 30 minutes.

### 4.3 — Currency conversion rates are client-side hardcoded
**Problem:** `currencyRatesToUSD` is defined in `investorHome.tsx` as static object. Any rate change requires a code deploy. EUR/TND/CNY fluctuate meaningfully.  
**Fix Option A (no API cost):** Move rates to a `.env` var or a `GET /public/exchange-rates` endpoint that reads from a config JSON. Admin can update without a deploy.  
**Fix Option B (live rates):** Integrate a free-tier exchange rate API (e.g., `exchangerate-api.com` free tier = 1500 req/month). Cache in backend with a daily TTL.  
**Recommended:** Option A first, Option B later.  
**Effort A:** 45 minutes.

---

## 5. Visual Polish & Performance

### 5.1 — No custom favicon
**Problem:** The app still uses the default React CRA favicon in the browser tab. First impression of the tab itself is generic.  
**Fix:** Create a simple favicon: a circular "N" or cargo ship icon in the accent color. 32x32 PNG + a `favicon.svg`. Replace in `/public/`.  
**Effort:** 20 minutes (design) + 5 minutes (wiring).

### 5.2 — Investor login page: visual design doesn't match landing
**Problem:** The `/login` page has a form-centric minimal design that doesn't match the gamified dark glass aesthetic of the investor dashboard or landing page. A visitor who clicks "Login" from the landing page sees an abrupt style change.  
**Fix:** Apply the same dark glass card style used in `join.css` to the investor login page — centered dark card, branded NomadMee header with accent color, theme consistent with the landing.  
**Effort:** 1 hour.

### 5.3 — Globe section: no hint text when no investors are loaded
**Problem:** If the `/public/map-data` fetch fails or returns no investors, the globe is just a blank dark map with no dots and no message. Looks broken.  
**Fix:** Show a subtle centered overlay: "Loading investor map…" with a small spinner while fetching, or "No investors to display" if data is empty. The `WorldMap` component would need a `loading` and `empty` prop.  
**Effort:** 30 minutes.

### 5.4 — Cargo cards: no visual shipping type icon
**Problem:** Cargo cards in the investor "Cargos" tab show the route (`China → Abidjan`) but no icon for shipping type (sea/air/land). The admin list has these icons, the investor view doesn't.  
**Fix:** Add `🚢` / `✈️` / `🚛` before the route on each cargo card, same as admin does. One-line change.  
**Effort:** 5 minutes.

### 5.5 — Landing page: globe section loads MapLibre synchronously
**Problem:** The globe is the hero section, but MapLibre initializes only after the component mounts and tiles begin loading. Until tiles arrive, the viewport shows the raw dark base color.  
**Fix:** Show a semi-transparent globe SVG placeholder while tiles load. MapLibre exposes an `idle` event — use it to fade in the real map and fade out the placeholder with a CSS transition.  
**Effort:** 45 minutes.

---

## 6. Minor but High-Visibility

### 6.1 — Join form: phone number validation hint
**Problem:** The WhatsApp contact field accepts free-text phone input. Users in different countries format numbers differently (+216, 00216, 216...). The admin then has to manually clean the number to open the WhatsApp link.  
**Fix:** Add a small hint "Include country code, e.g. +216 XX XXX XXX" below the field. Optionally auto-strip non-digit characters in the `wa.me/` link on the admin side (already done — `replace(/\D/g, '')` — just show the hint on the form too).  
**Effort:** 5 minutes.

### 6.2 — Admin: `window.confirm` for logout
**Problem:** No — logout has no confirm. Clicking logout in admin kicks you out immediately with no "Are you sure?". Accidental logout mid-edit loses work.  
**Fix:** Replace the logout button's `onClick` with an inline confirm state: first click shows "Really log out?" and a Confirm/Cancel inline. Second click logs out.  
**Effort:** 15 minutes.

### 6.3 — 404 fallback page
**Problem:** The `*` route in the router silently redirects to `/`. A user who bookmarks a broken or old URL just ends up on the landing page with no explanation.  
**Fix:** Add a minimal `NotFound` component at `*` that shows "Page not found" + a link back to `/`. Styled dark glass card, consistent with the rest of the app. 10 lines of JSX.  
**Effort:** 20 minutes.

### 6.4 — `dashboard.ts` legacy route still registered
**Problem:** `backend/src/routes/dashboard.ts` and `server.ts` still has `/api/dashboard` registered. This exposes a hardcoded investor credentials array (a security concern) and adds dead maintenance weight.  
**Fix:** Delete `dashboard.ts` and remove its registration from `server.ts`. Confirm no frontend code calls `/api/dashboard` first (it doesn't — the frontend only uses `/api/portal`).  
**Effort:** 15 minutes.

---

## Priority Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | 1.2 — Admin credentials in env vars | 15 min | Critical |
| 2 | 6.4 — Delete legacy dashboard.ts | 15 min | Security |
| 3 | 1.4 — Rate limiting on login | 20 min | Security |
| 4 | 1.1 — Bcrypt passwords | 1 hr | Critical |
| 5 | 1.3 — Persist tokens in DB | 2 hr | Reliability |
| 6 | 2.1 — Back link on login page | 10 min | First impression |
| 7 | 5.4 — Shipping type icon in investor cargos | 5 min | Polish |
| 8 | 3.5 — Auto-read on card expand | 10 min | Admin UX |
| 9 | 2.4 — Tier label or remove | 20 min | Authenticity |
| 10 | 6.3 — 404 page | 20 min | Polish |
| 11 | 2.7 — Styled delete confirm | 45 min | Aesthetic |
| 12 | 2.6 — Toast notifications | 1 hr | Admin UX |
| 13 | 2.3 — ETA progress bar on cargo cards | 45 min | Investor UX |
| 14 | 3.2 — Admin search/filter | 30 min | Admin UX |
| 15 | 4.3A — Configurable exchange rates | 45 min | Data accuracy |
| 16 | 5.2 — Login page style upgrade | 1 hr | First impression |
| 17 | 4.1 — Remove estimatedROI redundancy | 30 min | Data integrity |
| 18 | 4.2 — Clean up orphaned uploads | 30 min | Storage hygiene |
| 19 | 3.1 — Unsaved-changes warning | 45 min | Admin UX |
| 20 | 5.1 — Custom favicon | 25 min | Branding |
