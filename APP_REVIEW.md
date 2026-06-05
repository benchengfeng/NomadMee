# nomadme — Full App Review & Improvement Plan

_Senior engineering + design audit. Prepared 2026-06-05, ahead of public launch._

This document is the result of a full sweep of the codebase: backend (Express/Mongo),
frontend (React/Redux/i18n), auth, deploy pipeline, data model, business logic, and UX.
It is organized so you can act on it in order:

- 🔴 **Before launch** — do these today / this week. Real risk to money, data, or reputation.
- 🟡 **Right after launch** — important, but won't break the launch.
- 🟢 **Future** — polish, scale, and maintainability.

Each item has a **severity**, **effort** (S/M/L), and a concrete fix.

---

## 0. Executive summary

The app is in genuinely good shape for a solo/small build: clean route structure, bcrypt
password hashing with auto-migration, DB-backed sessions with TTL expiry, rate-limited
logins, a thoughtful gamified UX, on-demand data loading, and a working CI→VPS deploy.

The gaps that matter most before going public are **not** about features — they're about
**(1) a hardcoded admin password fallback, (2) no spam protection on the public order/contact
forms, (3) no notification when an order arrives, (4) a currency display bug that shows the
wrong price symbol, and (5) social-share/SEO meta that makes shared links look broken.**
None are large; all are launch-blockers for a site whose whole growth plan is "share links online."

---

## 🔴 Before launch



### 3. You get no alert when an order or contact request arrives — **HIGH / M**
Orders and contact requests only surface as an **unread badge inside the admin dashboard**.
If you don't log in, you never know a sale came in — and the whole site exists to capture these.
**Fix:** on `POST /public/product-order` and `/public/contact-request`, send yourself a
notification email (you already have a working `nodemailer` transport in `routes/sendEmail.ts`
and `EMAIL_USER/EMAIL_PASS` configured). Fire-and-forget, wrapped in try/catch so a mail
failure never fails the customer's request. Optionally a WhatsApp/Telegram webhook later.

### 6. Confirm a MongoDB backup exists — **CRITICAL / S**
Investors, orders, and contact requests will live only in Mongo on your VPS. There's no backup
step in the pipeline.
**Fix:** enable automated `mongodump` (cron + offsite copy) or use a managed Mongo with backups
**before** real data arrives. Test a restore once.

### 7. Lock down CORS for production — **MEDIUM / S**
`server.ts` uses `origin: true` (reflect any origin) **with** `credentials: true`, and the manual
`OPTIONS` handler sets `Access-Control-Allow-Origin: *`. That's both permissive and internally
inconsistent (`*` + credentials is invalid and can cause sporadic CORS failures).
**Fix:** restrict `origin` to your real domains (`https://nomadme.life`, `https://app.nomadme.life`,
plus localhost for dev). Since auth is a Bearer token in `localStorage` (not cookies), you can
also drop `credentials: true`. Remove the redundant manual OPTIONS block.


## 🟡 Right after launch

### 9. Cookie-consent / analytics compliance — **MEDIUM / S**
You ship **two** analytics systems: Google Analytics (`gtag`, id `G-VBZ0CR1STL` hardcoded in
`index.html`) **and** Umami (cookieless). For an EU/worldwide audience, GA sets cookies and needs
consent; running it without a banner is a GDPR risk.
**Fix:** pick one. Umami (already wired, privacy-first, no banner needed) is the cleaner choice —
remove the GA snippet. If you keep GA, add a consent banner.

### 10. Internationalize the shop & partner components — **MEDIUM / M**
The site advertises EN/FR/AR/ZH, but the entire shop UI is hardcoded English:
`"Order Now"`, `"Choose a size"`, `"Quantity"`, `"Out of stock"`, the full success message,
and every form label in `ShopSection.tsx`; plus `"Tap to learn more"` / `"Tap to flip back"` in
`PartnersShowcase.tsx`. An Arabic or Chinese visitor sees a half-translated store.
**Fix:** move these strings into the `landing` i18n namespace like the rest of the app.

### 11. Graceful error states instead of silent `.catch(() => {})` — **MEDIUM / S-M**
Data fetches in `home.tsx`, `shopPage.tsx`, etc. swallow errors (`.catch(() => {})`). If the API
is down, sections just render empty with no explanation, looking broken.
**Fix:** show a small "couldn't load — retry" state. Add a top-level React **ErrorBoundary**
(there is none today) so a render crash shows a friendly page instead of a white screen.

### 12. Order/stock race & "no stock decrement" — document or handle — **LOW-MEDIUM / S**
Orders are inquiries (no payment, no stock decrement), so two people can "order" the last unit
and `stock` never changes. That's fine for a contact-first model, but make it intentional:
either hide the stock number, or clearly treat "Out of stock" as advisory. Decide and document.

### 13. Use `npm ci` in CI; pin Node — **LOW / S**
`.github/workflows/deploy-vps.yml` builds with `npm install` (frontend + backend), which can
drift from the lockfile. The VPS step already uses `npm ci --omit=dev` (good). Switch the build
steps to `npm ci` for reproducible builds.

### 14. Health, uptime, logging — **LOW-MEDIUM / S**
`/api/status` exists — point an uptime monitor (UptimeRobot/BetterStack) at it so you know if the
VPS or Mongo goes down. Consider minimal structured logging; today it's 4 `console.*` calls.

---

## 🟢 Future (scale & maintainability)

### 15. Split the monolith files — **M-L**
- `backend/src/routes/portal.ts` is **1,481 lines** doing auth, uploads, cargo, investors,
  investments, shop, orders, partners, avatars, site content. Split into route modules
  (`routes/admin/*`, `routes/public/*`, `routes/investor/*`) + a shared `requireAdmin`/`requireInvestor`
  **middleware** (the current "returns boolean and writes the response" pattern works but is unusual).
- `client/src/views/adminDashboard.tsx` is **2,239 lines**. Extract each admin section
  (Products, Orders, Partners, Investors, Cargos, Content) into its own component file.

### 16. Adopt a validation library (zod) — **M**
The hand-rolled `normalizeNumber/Currency/Variants/...` helpers are verbose and easy to drift.
A schema lib (zod) gives one source of truth for request shape + types + error messages, and
closes NoSQL-injection edge cases (e.g. an attacker sending `{$ne:null}` where a string is
expected) more systematically than ad-hoc `String(x)` coercion.

### 17. Multilingual DB content — **M-L** (revisit when ready)
Admin-authored content (products, investments, partners, "who are we") is single-language —
whatever you typed. The earlier `LocalizedString {en,fr,ar,zh}` direction was the right one; it
was reverted to keep things manual for now. When the audience justifies it, reintroduce the
4-field manual inputs (no auto-translate) and a `loc()` resolver, rolled out model by model.

### 18. Delete dead/legacy template code — **S-M**
Confirmed **unused** (0 references): `components/home/` → `appAfrica`, `appEurope`, `pricing`,
`works`, `faq`, `hero`, `company`, `buisinessShowCase` (also a typo'd filename), `homeDeals`,
`about`. Also: the legacy `client/src/common/i18n/{en,fr}.json` (superseded by
`public/locales/*`), stray `translation.json` (only en/fr), and the unused `api/fetcher.tsx`
(`useFetcher`, typed `any[]`). Removing these shrinks the bundle and the mental load.

### 19. Modernize React 18 root + minor cleanups — **S**
`index.tsx` still uses the React-17 `ReactDOM.render` even though React 18 is installed — switch
to `createRoot` to unlock concurrent features. Minor: `sendEmail.ts` uses `var` + `require` and
mixes styles; tidy when touched.

### 20. Auth hardening (later) — **M**
- Tokens live in `localStorage` (XSS-stealable). The standard upgrade is httpOnly+SameSite
  cookies, but that's a meaningful refactor — fine to defer.
- Investor sessions last 7 days with no refresh/rotation; admin 24h. Reasonable; revisit if needed.

### 21. Payments — **M** (separately scoped)
When you move from "we'll contact you" to real checkout: confirm PayPal **payout availability in
your country first**, upgrade personal→Business (free), then wire PayPal Smart Buttons + Orders
API + a webhook that flips the order to `paid` in the existing Orders inbox. (Discussed earlier.)

---

## Quick-win checklist for launch day

**Done in code (this session):**
- [x] `'admin112233'` fallback removed — admin login disabled unless `ADMIN_PASSWORD` is set.
- [x] Rate limit (8 / 10 min / IP) + honeypot on `/public/product-order` and `/public/contact-request`; `trust proxy` set so limits work behind nginx.
- [x] Shop shows the real currency symbol; new products default to **EUR**.
- [x] `helmet` added; CORS restricted via `ALLOWED_ORIGINS`; redundant OPTIONS handler & `credentials:true` removed.
- [x] Free-text fields length-capped server-side (orders, contact, KYC).

**Config you must still do before launch (no code — env / data):**
- [ ] Set a strong `ADMIN_PASSWORD` (+ optional `ADMIN_USERNAME`) in `secrets.VPS_ENV_FILE`.
- [ ] Set `ALLOWED_ORIGINS=https://nomadme.life,https://app.nomadme.life` in the backend `.env`.
- [ ] Re-check existing products are priced in **EUR** in the admin panel.
- [ ] MongoDB backup running and a restore tested.

**Still open (code — not done yet):**
- [ ] Email-on-new-order / new-contact to yourself _(#3)_.
- [x] **Code:** Static OG/Twitter meta + real `<title>` in `index.html` _(#5 layer 1 — done)_.
- [x] **Code:** Backend prerender endpoint `GET /public/og/shop/:productId` for per-product social previews _(#5 layer 2 — done)_.
      → **You still need to apply the nginx snippet from `nginx-og-snippet.conf`** to activate per-product bot routing. Without it, the endpoint exists but bots won't hit it automatically.
      → **Optional:** replace `logo512.png` with a branded 1200×630 social card image for a richer preview.
      → Set `SITE_ORIGIN=https://app.nomadme.life` in the backend `.env` (defaults to that if unset).
- [ ] Pick one analytics (recommend Umami) and remove the other _(#9)_.
- [ ] Add a top-level ErrorBoundary _(#11)_.

---

## What's already solid (keep it)

- bcrypt hashing with transparent plain-text→hash migration on investor login.
- DB-backed sessions with Mongo TTL auto-expiry; rate-limited login routes.
- Clean public/admin/investor route separation; consistent `requireAdmin` gating.
- On-demand section data loading on the landing page; skeleton loaders.
- Thoughtful shop UX: detail→form→done flow, contact-method toggle, share link, country datalist,
  expectation-setting confirmation copy.
- Cookieless analytics option, typed event names.
- Working, reproducible-ish CI→VPS pipeline with secret-injected `.env`.
