# nomadme App Reference

## High-level overview
nomadme is a product sourcing application focused on trade between China and Côte d'Ivoire. It includes:
- A public marketing website for visitors.
- An investor portal where investors sign in to view their investment and assigned cargos.
- An admin portal where administrators create cargos, create investors, and assign cargos to investors.
- A backend API with two separate route groups: `/api/portal` for the main investor/admin portal and `/api/dashboard` for a legacy/static investor dashboard and AIS stream tracking.

## Backend structure

### Entry point
- `backend/src/server.ts`
  - Configures Express, CORS, body parsing, and routes.
  - Connects to MongoDB via `connectMongo()`.
  - Starts the AIS stream snapshot job.
  - Registers routes:
    - `/api/sendEmail`
    - `/api/status`
    - `/api/dashboard`
    - `/api/portal`

### Legacy dashboard route
- `backend/src/routes/dashboard.ts`
  - Contains a hardcoded `investors` array with manual credentials.
  - Supports login with `POST /api/dashboard/login`.
  - Supports dashboard data with `GET /api/dashboard/home`.
  - Returns projection calculations:
    - `projectedProfit`
    - `projectedPayout`
  - Returns AIS stream metadata and tracked ship information.
  - Uses in-memory token storage via `authTokens`.

### Portal route (main investor/admin flow)
- `backend/src/routes/portal.ts`
  - Uses MongoDB models `CargoModel` and `InvestorModel`.
  - Contains hardcoded admin credentials:
    - username: `admin`
    - password: `admin112233`
  - Uses in-memory token storage for `adminTokens` and `investorTokens`.

#### Admin endpoints
- `POST /api/portal/admin/login`
- `POST /api/portal/admin/logout`
- `GET /api/portal/admin/dashboard`
- `GET /api/portal/admin/cargos`
- `POST /api/portal/admin/cargos`
- `GET /api/portal/admin/investors`
- `POST /api/portal/admin/investors`

Admin user can:
- Create cargo records.
- Create investor records.
- Assign cargos to investors.
- Load a dashboard containing both cargos and investors.

#### Investor endpoints
- `POST /api/portal/investor/login`
- `POST /api/portal/investor/logout`
- `GET /api/portal/investor/home`

Investor login validation is based on stored plain-text credentials.
Investor dashboard returns:
- investor profile information
- assigned cargos

### Models
- `backend/src/models/Investor.ts`
  - Fields: `name`, `username`, `password`, `investmentAmount`, `profitPercentageOnInvestment`, `estimatedROI`, `assignedCargoIds`.
  - Stored in MongoDB.

- `backend/src/models/Cargo.ts`
  - Fields: `productBeingShipped`, `quantity`, `purchaseLocation`, `purchasePrice`, `shippingDestination`, `shippingPrice`, `otherExpenses`, `estimatedTimeOfArrival`, `estimatedTimeOfSelling`, `assignedInvestorIds`.
  - Stored in MongoDB.

### Email and status support
- `backend/src/routes/sendEmail.ts`
  - Sends contact form email using Nodemailer and environment credentials.

- `backend/src/routes/status.ts`
  - Simple health check endpoint.

### AIS stream service
- `backend/src/services/aisStreamSnapshotJob.ts`
  - Updates AIS ship tracking data for the legacy `/api/dashboard` route.

## Frontend structure

### Router
- `client/src/routes/appRouter.tsx`
  - Defines app navigation.
  - Investor routes:
    - `/` → `InvestorLogin`
    - `/home` → `InvestorHome`
  - Admin routes:
    - `/admin` → `AdminLogin`
    - `/admin/dashboard` → `AdminDashboard`
  - Marketing pages and other routes also exist.
  - Uses local storage token checks for protected routes.

### Investor experience
- `client/src/views/investorLogin.tsx`
  - Login form for investors.
  - Stores token in local storage using `saveInvestorToken()`.

- `client/src/views/investorHome.tsx`
  - Fetches investor home data from `/api/portal/investor/home`.
  - Displays:
    - investor name and username
    - investment amount
    - profit percentage
    - estimated ROI
    - list of assigned cargos with shipment details
  - Supports logout through `logoutInvestor()`.

### Admin experience
- `client/src/views/adminLogin.tsx`
  - Login form for admin.
  - Stores admin token in local storage using `saveAdminToken()`.

- `client/src/views/adminDashboard.tsx`
  - Loads admin dashboard data from `/api/portal/admin/dashboard`.
  - Cargo creation form.
  - Investor creation form.
  - Cargo assignment controls.
  - Displays lists of cargos and investors.

### API client
- `client/src/api/portalApi.ts`
  - Contains API wrappers for portal operations.
  - Uses bearer token authorization from `client/src/utils/auth.ts`.
  - Supports admin and investor login/logout, dashboard fetch, cargo creation, investor creation, investor home fetch.

### Auth storage
- `client/src/utils/auth.ts`
  - Stores investor/admin JWT-like tokens in local storage.
  - No refresh token or secure storage.

## Business logic summary
- Investor accounts are currently created manually via the admin dashboard.
- Each investor gets:
  - a username/password
  - investment amount
  - profit percentage
  - estimated ROI
  - assigned cargo list
- Cargo records store sourcing details such as locations, costs, shipping destination, and ETA.
- Investor home is a simple dashboard to view assigned cargos and investment metrics.
- The admin can manage investors and cargos in the same interface.

## Important observations
- There are two separate backend patterns:
  1. `backend/src/routes/dashboard.ts` with hardcoded investor credentials and AIS tracking.
  2. `backend/src/routes/portal.ts` with MongoDB-backed investor/cargo management.
- Credentials are plain text and token storage is memory-based.
- Investor experience is limited to a basic summary and cargo list.
- Admin experience is basic form CRUD with no search, filtering, or analytics.
- UI is functional but designed more like a portal prototype than a modern consumer investment product.

## Quick reference for future work
- Use `client/src/api/portalApi.ts` for portal data flows.
- Use `backend/src/routes/portal.ts` and the MongoDB models for main investor/admin features.
- Use `backend/src/routes/dashboard.ts` only for legacy or AIS-demo flows.
- Enhancements should focus on onboarding, polished investor dashboards, secure auth, and a stronger brand experience.
