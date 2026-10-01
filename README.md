# EstateHub

EstateHub is a full-stack rental platform that connects people looking for a home with property managers. The public site helps visitors discover and compare properties; signed-in tenants and managers use separate workspaces to handle applications and ongoing rentals.

## What the project does

| Area | Tenant experience | Manager experience |
| --- | --- | --- |
| Discover | Search by location and filters, explore results on a map, view photos and property details | Publish and update property listings |
| Decide | Save favorites, contact a manager, submit an application | Review applications and communicate with applicants |
| Rent | Track application status, confirm a cash handover, view a residence, request a lease renewal | Review payment claims, manage leases, prepare signing details and export property history |
| Account | Manage profile and preferences, receive notifications | Manage profile and preferences, receive notifications |

The interface supports light and dark themes and adapts to desktop, tablet, and mobile screens. Maps and location search use Mapbox. Property photos are stored through Cloudinary. Chat uses Socket.IO for real-time message and typing updates.

## How it is built

The repository has three independently running services:

```text
estatehub-enterprise-rental-app/
├── client/   Next.js web application (port 3000)
├── server/   Express REST API and Prisma schema (port 5000)
├── socket/   Socket.IO chat service (port 4000)
└── docs/     Architecture, plans, and verification reports
```

| Layer | Main technologies | Responsibility |
| --- | --- | --- |
| Web | Next.js 16, React 19, Tailwind CSS, Redux Toolkit | Pages, forms, map, dashboards, application state |
| API | Node.js, Express, Prisma | Authentication, authorization, property data, applications, leases, notifications |
| Data | PostgreSQL with PostGIS | Users, listings, geographic locations, applications, leases, payments, chats |
| Real-time | Socket.IO | Authenticated chat and typing events |
| External services | Mapbox, Cloudinary | Maps/location search and property image storage |

The browser calls the API at `/api`. The socket service uses the API to verify conversation membership before forwarding chat events. Both services must share the same access-token secret.

Each service keeps its own source and tests. See the [web app folder guide](client/README.md) and [document index](docs/README.md) for more detail. Generated PDF exports go to the root `output/` folder and are ignored by Git.

## Main pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page and entry point to property search |
| `/search` | Filterable property results with map and card views |
| `/search/[id]` | Public property details, photos, and application entry point |
| `/sign-in`, `/sign-up` | Account access |
| `/tenants/*` | Tenant favorites, applications, payments, residences, and settings |
| `/managers/*` | Manager properties, applications, payments, and settings |

## Run locally

### Requirements

- Node.js and npm (or Bun for dependency installation).
- PostgreSQL with the PostGIS extension enabled.
- A public Mapbox access token.
- Cloudinary credentials for property photo uploads.

### 1. Install dependencies

```powershell
git clone https://github.com/DeathHunterX/estatehub-enterprise-rental-app.git
cd estatehub-enterprise-rental-app
npm install --prefix client
npm install --prefix server
npm install --prefix socket
```

Alternatively, `npm run setup` installs the three services with Bun.

### 2. Configure the services

```powershell
Copy-Item client/.env.example client/.env.local
Copy-Item server/.env.example server/.env.local
Copy-Item socket/.env.example socket/.env.local
```

Fill in the values in each local file. The example files document the available variables:

| File | Key settings |
| --- | --- |
| `client/.env.local` | API URL including `/api`, public Mapbox token, socket URL |
| `server/.env.local` | PostgreSQL URL, `PORT=5000`, client URL, JWT secrets, Cloudinary credentials, `NOMINATIM_SEARCH_URL` and `NOMINATIM_USER_AGENT` |
| `socket/.env.local` | `SOCKET_PORT=4000`, client URL, API URL, the **same** `JWT_ACCESS_TOKEN_SECRET` as the API |

Do not commit local environment files or real credentials.
Replace the sample `legal@estatehub.example` in `NOMINATIM_USER_AGENT` with a real monitored contact before creating or editing listings. The sample is documentation only; the server requires both Nominatim variables for address lookup.

### 3. Prepare the database

For a new, empty database, apply the checked-in Prisma migrations and generate the client from `server/`:

```powershell
cd server
npm run prisma:deploy
npm run prisma:generate
cd ..
```

The schema and migration history live together in [`server/prisma`](server/prisma/README.md). They include PostGIS, unaccent, all current tables, indexes and the data backfills needed by earlier installations. Prisma loads local settings through `server/prisma.config.ts`; no custom CLI or separate SQL upgrade folder is needed.

For an existing database, back it up, run `npm run prisma:status`, then follow the [existing-database guide](server/prisma/README.md#existing-databases). Do not reset a database that contains real records. Future schema changes use `npm run prisma:migrate -- --name descriptive_change`; migration/reset commands skip automatic seeding.

`prisma:generate` also updates the Prisma type file consumed by the client. To add optional demo data, explicitly run the seed from `server/`:

```powershell
npm run prisma:seed
```

The 25 demo accounts (10 Managers and 15 Tenants) have distinct passwords listed in [`server/prisma/SEED_ACCOUNTS.md`](server/prisma/SEED_ACCOUNTS.md). The fixture stores bcrypt hashes. The seed includes all current tables and application statuses; dates shift together to the time you seed. Demo manager agreement profiles are drafts: each manager must complete their own encrypted signature and privacy/sharing acknowledgements before creating a listing or approving an application. Repeating the seed stops on conflicts instead of overwriting records. Seeding is disabled when `NODE_ENV=production`.

### 4. Start the services

Open three terminals at the repository root:

```powershell
npm run dev:server
```

```powershell
cd socket
npm run dev
```

```powershell
npm run dev:client
```

Then open `http://localhost:3000`. The root package has separate `dev:client` and `dev:server` scripts; it does not have a combined `dev` script.

## Development commands

| Working directory | Command | Purpose |
| --- | --- | --- |
| `client/` | `npm run lint` | Lint the web application |
| `client/` | `npx tsc --noEmit` | Check frontend types |
| `server/` | `npm test` | Build and run API tests |
| `socket/` | `npm test` | Build and run socket tests |
| `server/` | `npm run prisma:validate` | Validate the Prisma schema |
| `server/` | `npm run prisma:deploy` | Apply checked-in migrations |
| `server/` | `npm run prisma:status` | Check applied and pending migrations |
| `server/` | `npm run prisma:migrate -- --name descriptive_change` | Create a development migration for a schema change |

## Current scope

Applications, listing availability, cash settlement, leases, and renewals are modeled in the app. An approved application does not become a lease until the cash handover is confirmed by both parties. Managers can export a property's application, lease, and payment history as CSV.

On first sign-in, a manager is directed to **Lease agreement setup**. They must save a legal name, agreement terms, an encrypted signature and two acknowledgements covering applicant privacy and information sharing before creating a property or approving an application. The API enforces the same rule, including for existing managers with an incomplete setup. Managers can revise the setup later from Settings. The signature passphrase stays in the browser and is not stored by the server.

Managers can open **Payments & deadlines** from their sidebar (or from Applications) to choose a payment term when approving a pending application, follow approved payments, and review completed first payments. Approval sets a deadline 7–21 days later (14 days by default). An hourly server task declines an unpaid application after its deadline if the tenant has not reported handing over cash. A tenant cash claim keeps the application open for manager confirmation or dispute. A manager can request cancellation of an approved, unpaid application without a lease or cash claim; the server locks payment immediately and completes the non-reversible cancellation after 48 hours. For an older approved application with no lease, payment, or cash claim, the manager can set one new 7–21 day window from today and the tenant receives an account notification. Older approvals with an existing lease remain visible for payment follow-up, but have no automatic application deadline because a lease already exists.

Tenants can open **Payments** from their sidebar or an approved application to see the first amount due, deadline, payment method, cash handover confirmations, and completed payment records. The tenant Applications page supports status filters and property-name search; its payment action links to the dedicated page.

Bank transfer is not connected to a payment provider yet, so the API rejects that payment method. In-app notifications are available; outbound notification emails are not configured. Cash handover relies on the tenant's and manager's confirmations and may require manual dispute resolution.
