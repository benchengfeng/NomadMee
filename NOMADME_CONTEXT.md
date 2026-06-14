# NomadMe — Full Context Document
## For use as AI agent system context

This document gives a complete picture of the NomadMe business, product, and technical platform.
It is intended to be fed as context to an AI agent (Claude Sonnet 4.6 or similar) so it can
understand the business well enough to contribute to strategy, planning, or execution.

---

## 1. What is NomadMe?

NomadMe is a **cross-continental trading and micro-investment platform** operated by a solo
founder (Beng Chengfeng). The core business is:

1. **Import goods** from manufacturing hubs (primarily China / Guangzhou) to high-demand
   markets in **West Africa** (primary target: Côte d'Ivoire / Ivory Coast, and expanding).
2. **Sell those goods** through an integrated e-commerce shop (online + order-by-contact model).
3. **Offer investment participation** to a network of private micro-investors who co-fund the
   import operations and receive a fixed profit percentage when the cargo sells.

The platform is the digital infrastructure for all three of these activities at once. It is not
a marketplace — NomadMe is the merchant, the importer, and the fund operator. Investors do not
buy equity; they participate in specific cargo operations with a fixed promised return.

---

## 2. The Business Model in Detail

### 2a. Import-and-sell (core trade)

- The operator identifies a product with strong demand in West Africa that can be sourced cheaply
  from Chinese manufacturers (Alibaba / Guangzhou wholesale markets).
- A batch is purchased (e.g. 1,000 units of motorcycle raincoats at ~$20,000 USD), shipped
  (sea freight to Abidjan port, ~$10,000 USD), cleared through customs and sold locally.
- The shop on the website is the digital storefront — customers (end buyers or local resellers)
  order via WhatsApp or email. There is no payment gateway yet; contact-first ordering.
- The margin between landed cost and selling price is the business profit.

### 2b. Investor participation (micro-investment)

- Before or during a cargo operation, the operator opens an "investment" on the platform.
- Investors can join with any amount (minimum $1 in the current live investment).
- Each investor is assigned a **fixed profit percentage** (currently 30% of their investment).
  This is a fixed-return model, not equity — if you invest $120 EUR, you get $36 EUR back on top
  when the cargo sells, regardless of actual margin.
- Investors are real people with real relationships to the founder (family, diaspora network,
  business contacts). Current investor base: 4 people across China, Tunisia, and Europe.
- Investors log into a private dashboard where they can see their invested amount, projected
  payout, which cargo their money is in, the cargo's real-time position on a map, and the shop.

### 2c. The shop as a multi-purpose channel

The shop serves dual purposes:
- **Revenue** from direct product sales (B2C and B2B/reseller).
- **Trust signal** for investors — seeing real products being sold reassures them the business
  is operational and legitimate.

The shop is split into two families:
- **From the Earth** (`section: food`): food products, organic goods, consumables.
- **From the Hands** (`section: artisanal`): handcrafted items, musical instruments (djembe,
  kora, balafon), masks, sculptures, artisan crafts.

Each product has: name, description, origin story, price (with currency), variants (sizes/colors),
gallery images/videos, cover image, stock count, and an optional boutiqueId linking it to a
partner boutique.

---

## 3. Current Live Operations (from DB snapshot, 2026-06-09)

### Active Cargo
| Field | Value |
|-------|-------|
| Product | Motorcycle Raincoats |
| Quantity | 1,000 units |
| Purchase location | Guangzhou, China |
| Destination | Abidjan, Côte d'Ivoire |
| Purchase price | ~$20,000 USD |
| Shipping cost | ~$10,000 USD |
| Other expenses | ~$10,000 USD |
| Total operation cost | ~$40,000 USD |
| Shipping type | Sea freight (to be updated in admin) |
| ETA | May–June 2026 |

### Active Investment
| Field | Value |
|-------|-------|
| Title | "New Product brought to Côte D'Ivoire" |
| Description | "Motorcycle raincoats are a necessity in West Africa" |
| Minimum investment | $1 USD |
| Currency | USD |
| Status | Active |
| Investors assigned | 4 |

### Current Investors
| Name | Username | Amount | Currency | Profit % | Est. Return | Location |
|------|----------|--------|----------|----------|-------------|----------|
| Turki | mligshen | 1,500 | CNY | 30% | 450 CNY | China |
| Mohamed Firass Ben Hiba | mrfey | 120 | EUR | 30% | 36 EUR | — |
| Kais Ben Abdallah | tontondubled | 7,000 | TND | 30% | 2,100 TND | — |
| Mohamed Malek Ben Hiba | makikou | 280 | EUR | 30% | 84 EUR | — |

Total capital raised (converted): mixed currencies — approximately equivalent to ~$3,500–4,000 USD
across all investors. This covers roughly 8–10% of one cargo operation's cost, meaning the
founder is fronting the remainder personally.

### Products
The products collection was empty in this snapshot — products are managed through the admin
panel and may have been added after this dump was taken.

---

## 4. The Platform — Technical Overview

### Stack
- **Frontend**: React 18 + TypeScript, Create React App, Redux Toolkit
- **Backend**: Node.js + Express + TypeScript, Mongoose/MongoDB
- **Map**: MapLibre GL (open-source, no API key) with CartoDB dark tile style
- **i18n**: react-i18next, 4 languages (EN, FR, AR, ZH), 6 namespaces
- **Analytics**: Umami (self-hosted, cookieless, GDPR-friendly), 30+ typed events
- **Media**: Cloudinary (product images, videos, gallery, cargo stories)
- **Email**: Alibaba Cloud SMTP (Aliyun) via nodemailer
- **Deploy**: GitHub Actions → VPS (nginx reverse proxy)
- **Auth**: bcrypt-hashed passwords, MongoDB-backed sessions with TTL, rate-limited logins

### User Roles
1. **Public visitor** — sees landing page, globe map, investments, shop
2. **Investor** — logs in with username/password, sees private dashboard
3. **Admin** — logs in separately, full CMS control over all content

---

## 5. The App Surface — Screen by Screen

### 5a. Landing Page (`/`)
A full-page themed experience with 8 selectable visual themes (Popeye's Harbor Crew, Olive's
Dream Market, Curto's Sunset Drift, Midnight Navigator, Noir Harbor Spy, Golden Trader, Neon
Dockhand, Verdant Cargo Captain). Themes change the entire atmosphere of the page.

**Navigation sections:**
- **Globe** (default): Interactive 3D world map showing all investors (cyan circles), investments
  (fuchsia diamonds), boutiques (amber), and live cargo routes (color-coded by transport type —
  sea=cyan, air=purple, land=orange). Cargos in transit pulse; arrived cargos do not.
- **Investments**: Cards for each active investment with status badge, cargo count, investor count,
  minimum investment, and a "Join" button.
- **Shop**: Full e-commerce shop embedded in the landing page.
- **Who Are We**: Admin-edited content about the company, social links, partner showcase.

**Nav also has**: Language switcher (EN/FR/AR/ZH), theme swatches, and a "Login" CTA button.

### 5b. Shop (`/shop`, also embedded in landing and investor dashboard)
Two-section layout:
- **From the Earth**: food, organic, consumable products
- **From the Hands**: artisanal crafts, musical instruments

Each section has:
- Product cards with cover image, name, price, currency, category emoji
- Bundle section (curated packs of products at a special price)
- Gallery (Showcase Reel): horizontal scroll strip of product photos/videos, opening in lightbox
- Clicking a product opens an order modal with: description, origin story, variants, quantity
  selector, contact method (WhatsApp or email), country input, optional note — then submits.

Orders are captured in the database and visible in the admin dashboard with status tracking.

### 5c. Join Investment (`/join/:investmentId`)
Public page for a specific investment. Shows investment title, description, status, cargo count,
investor count, minimum investment. Form to express interest: name, contact method, contact
detail, preferred meeting date/time, note. On submit, creates a ContactRequest in the DB.

### 5d. Contact Us (`/contact-us`)
Simple contact form — name, contact method (WhatsApp/email), message. Submits to the same
ContactRequest collection with type `contact_us`.

### 5e. Investor Login (`/login`)
Username + password. Redirects to dashboard if KYC complete, to onboarding if not.

### 5f. KYC Onboarding (`/onboarding`)
First-time investor setup: choose an avatar (from DB-managed avatar library, with optional
secret/unlockable avatars), display name, preferred display currency (USD/EUR/TND/CNY).

### 5g. Investor Dashboard (`/home`)
The private investor portal. Panels:

**Summary**: Hero card with avatar, display name, username. Stats: invested amount, projected
profit (30%), profit rate %, active cargos count, expected payout. All displayed in investor's
preferred currency with live conversion.

**Cargos**: List of all cargos assigned to the investor's investments. Each cargo shows:
transport type emoji, origin → destination, quantity, total cost, ETA. A "View Route" button
switches to the Map panel focused on that cargo. Live investment status rail at the top.

**Map / Route**: Full interactive MapLibre map. Shows ALL investor cargos simultaneously —
each cargo has a globe-style emoji pill marker (matching the public globe). The selected cargo's
route is bright; others are dimmed. Each marker shows shipping type (✈️/🚛/🚢), pulses if
in transit, stops pulsing on arrival. Controls: Play journey animation, pause, reset, jump to
current real-world estimated position based on purchase date → ETA → today.

**Shop**: Full embedded shop (same as public `/shop`) — products, bundles, galleries, order
modals. Investor can buy products directly from the dashboard.

**Support**: Contact button opening a pre-filled email to `contact@nomadmee.com`.

**Settings**: Change display name, display currency, avatar. Change password. Live avatar
preview. Selecting an avatar auto-applies its associated dashboard theme.

**Sidebar (desktop) / floating (mobile)**: Theme picker with the same 8 themes as the landing
page (split conic-gradient swatches). Logout button. Dashboard branding.

### 5h. Admin Dashboard (`/admin/dashboard`)
Full CMS. Sections:
- **Dashboard**: Overview stats (investor count, cargo count, contact requests, product orders)
- **Cargos**: Create/edit/delete cargos. Fields: product, quantity, locations, prices, currency,
  shipping type, ETA, cover image, description, cargo story (text + media gallery), purchase date.
- **Investments**: Create/edit/delete investments. Assign cargos and investors to them. Set status,
  current status text, minimum investment, cover image.
- **Investors**: Create/edit investor accounts. Set investment amount, profit %, currency,
  location. Assign to investments. See their username/password.
- **Products**: Create/edit/delete shop products. Section (food/artisanal), category, variants,
  gallery, cover image, origin story, stock, active/inactive, position order.
- **Bundles**: Curated product bundles. Section, included products, price, image.
- **Boutiques**: Partner boutiques/stores that can be linked to products.
- **Partners**: Showcase partners (logo, name, description, website link).
- **Content**: "Who Are We" page content (title, body text, media gallery, social links).
  Shop galleries (earth and hands section showcase images/videos).
- **Avatars**: Upload and manage investor avatars. Mark as secret/unlockable. Assign default theme.
- **Contact Requests**: View all join-investment enquiries and general contact messages. Update status.
- **Product Orders**: View all shop orders with full contact details. Update status.

---

## 6. Business Geography and Context

### Source market: China
- Guangzhou is the primary sourcing hub — access to wholesale markets (Yiwu, Guangzhou trade fairs)
- Products: manufactured goods with strong price advantage vs. local alternatives in target market
- Current focus: rainwear (motorcycle raincoats — extremely practical in tropical West Africa)

### Target market: West Africa (primary: Côte d'Ivoire)
- Abidjan is the commercial capital and primary port of Côte d'Ivoire
- High motorcycle ownership (motos are the dominant urban transport), therefore high demand for
  rain gear during the long rainy season (April–July and October–November)
- Growing middle class with purchasing power for quality imported goods
- Artisanal crafts (djembe, kora, masks, sculptures) are also high-value cultural exports from
  West Africa that can be sold to diaspora and international buyers through the platform

### The diaspora angle
The investor network so far is cross-continental (China, Tunisia, Europe). The founder has
connections across the Tunisian/North African diaspora and Chinese business community. This
is both the funding source and the target customer base for certain product categories.

---

## 7. Revenue Streams

| Stream | Status | Notes |
|--------|--------|-------|
| Product sales (shop) | Active (contact-first) | No payment gateway yet; WhatsApp/email orders |
| Investment returns (operator margin) | Active | Operator keeps margin above the 30% promised to investors |
| Artisanal craft sales | Active | Niche but high-margin |
| Future: payment gateway | Planned | PayPal Smart Buttons + Orders API |
| Future: boutique partnerships | Infrastructure ready | `boutiqueId` on products, boutiques in DB |

---

## 8. The Investment Mechanics (for an AI helping with business planning)

The current model is a **fixed-return private placement**, not a regulated investment product:
- Investors trust the founder personally (family/friends/network model)
- Returns are promised based on the operator's projection of the trade margin
- The operator absorbs all operational risk (if the cargo doesn't sell, the operator still owes
  the promised return — or renegotiates)
- No smart contracts, no escrow, no legal framework yet — entirely trust-based
- The digital platform creates transparency (investors can see the actual cargo on the map) and
  professionalism (gamified dashboard, real-time cargo tracking, proper accounting of amounts)

**The 30% return per operation** implies the operator believes the landed cost → sale price
margin is at minimum 30% on the invested capital portion. For motorcycle raincoats at ~$40,000
total landed cost selling to Abidjan distributors or retail, this is plausible if unit sell price
is ≥2x purchase cost (typical for these goods in West African retail).

---

## 9. Competitive Positioning

NomadMe is not trying to compete with:
- Amazon / major e-commerce (no logistics infrastructure)
- Investment funds (no regulation, no scale yet)
- Trade finance platforms (too formal, too Western)

NomadMe IS competing for:
- The **diaspora investor** who wants to put small amounts into real-world trade deals they
  understand, run by someone they trust, with full visibility
- The **niche buyer** who wants authentic West African artisan goods or quality imported items
  not available locally
- The **local West African reseller** who wants to source quality Chinese goods through a
  trusted importer who handles logistics

**Unique selling points:**
1. Full transparency — investors see their cargo on a live map
2. Dual model — same platform does both investment AND retail
3. Cultural authenticity — the artisan craft section bridges African heritage with global buyers
4. Low minimum investment — anyone can participate
5. Multi-language (EN/FR/AR/ZH) — covering the key diaspora languages

---

## 10. Open Questions for Business Planning

These are areas where an AI agent can meaningfully contribute:

1. **Pricing strategy**: What is the right sell price for 1,000 motorcycle raincoats in Abidjan?
   What are the margins that make 30% investor returns sustainable?

2. **Product expansion**: What are the next 3–5 products to import after raincoats? (High demand,
   good margin, easy to ship from China to West Africa)

3. **Investor acquisition**: How to grow from 4 investors to 40? What communication, legal
   safeguards, and reporting cadence builds trust at scale?

4. **Distribution in Côte d'Ivoire**: How to structure the on-the-ground sales network?
   Wholesaler, street market vendor, online local platforms (Jumia, etc.)?

5. **Shop growth**: What artisanal products are highest-margin for international sale? How to
   source from West African artisans and ship to Europe/North America/China?

6. **Regulatory path**: At what point does the investment model need a formal legal structure?
   What jurisdiction makes sense (Tunisia, France, Côte d'Ivoire, offshore)?

7. **Payment gateway**: Timing and approach for adding PayPal/Stripe. Impact on order conversion.

8. **Boutique partnerships**: How to recruit local boutiques in Abidjan to carry NomadMe-imported
   goods? Revenue share model?

---

## 11. Technical Capabilities Available (for AI agents building features)

The platform already has:
- Admin CMS for all content (no code changes needed for most data updates)
- Multi-currency display (USD, EUR, TND, CNY) with conversion
- Multi-language (EN, FR, AR, ZH) with RTL support
- Real-time cargo map with animated routes (MapLibre GL)
- File upload to Cloudinary (images, videos)
- Email transport (Alibaba Cloud SMTP)
- Session-based auth (investors + admin)
- Umami analytics with 30+ typed events
- Rate limiting + honeypot on all public forms
- CI/CD via GitHub Actions to VPS

What it does NOT yet have:
- Payment processing
- Push notifications (only email)
- Mobile app (web only, responsive)
- Automated investor reporting / statements
- Multi-operator / multi-merchant support
- Inventory management / low-stock alerts
- Order fulfillment tracking (post-sale)
- Legal document generation (investment contracts, receipts)

---

## 12. Brand and Voice

- **Name**: NomadMe — suggests mobility, travel, trade across borders
- **Characters**: The themes reference fictional/comic characters with a nautical/adventure spirit:
  Popeye, Olive Oyl, Corto Maltese (the wandering sailor-adventurer from Hugo Pratt's comics).
  This gives the brand a playful, story-driven identity. The investor dashboard uses these
  characters as avatar options.
- **Tone**: Adventurous, trustworthy, global, human. Not corporate. Not financial-jargon-heavy.
- **Visual identity**: Dark backgrounds with vibrant accent colors, animated globe, cargo routes
  that pulse like heartbeats. The UI communicates "this is real money moving through the real world."

---

*Document generated 2026-06-09. Based on live MongoDB dump + full codebase analysis.*
