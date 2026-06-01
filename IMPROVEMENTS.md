# NomadMee — Improvement Suggestions

Each item is scoped small. Grouped by area: Security & Reliability first, then UX/First Impression, then Admin Quality of Life, then Polish.

---
---

## 2. First Impression & Investor UX


---

## 3. Admin Quality of Life


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
