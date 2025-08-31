# EstateHub - Enterprise rental-app

EstateHub is a modern full-stack enterprise rental management system built to simplify property rentals for managers, tenants, and admins. It provides role-based access control, task automation, and real-time insights to streamline rental operations.

## 🚀 Features

-   ✅ Create, update, and delete tasks effortlessly
-   📅 Organize tasks by due dates and priorities
-   🏷️ Add categories or tags for better task grouping
-   🔔 Smart reminders to keep you on track
-   📈 Track your productivity and progress
-   🌙 Clean, distraction-free interface with dark mode
-   🔒 Secure user authentication (optional if using login)

## 🛠️ Tech Stack

**Frontend**

Next.js 15 (App Router, SSR, ISR)

TailwindCSS + Shadcn/UI

Redux Toolkit – state management

FilePond – file uploads

next-themes – dark/light mode support

nuqs – URL-based filters

React Hot Toast – notifications

Zod – form validation

FontAwesome – icons

**Backend**

Node.js + Express.js

Prisma ORM – database management

@terraformer/wkt – geospatial data handling

Axios – API requests

bcryptjs – password hashing

Cloudinary – image storage

Multer – file uploads

jsonwebtoken – authentication

uuid – unique ID generation

helmet, cors, morgan, dotenv, body-parser, cookie-parser – security & middleware

**Others**

Docker + Kubernetes – deployment & scaling

PWA – offline-first app experience

Socket.IO – real-time updates

## 📦 Installation

1. Clone the repository

```bash
    git clone https://github.com/DeathHunterX/moti--task-manager-project.git
    cd moti
```

2. Install dependencies
   Using **npm**

```bash
 npm install
```

Using **bun** (if you prefer speed ⚡):

```bash
 bun install
```

3. Set up environmental variables and configure the following

```bash
cp .env.local
```

Configuration

## ⚙️ Environment Variables

Front-end `.env.local`

```bash
NEXT_PUBLIC_CLIENT_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api"
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="<your-access-token>"
```

Back-end `.env`

```bash
SERVER_PORT= 5000
CLIENT_URL="http://localhost:3000"
DATABASE_URL="<your-database-url>"

JWT_ACCESS_TOKEN_SECRET="<your-access-token-secret>"
JWT_REFRESH_TOKEN_SECRET="<your-refresh-token-secret>"

CLOUDINARY_CLOUD_NAME="<your-cloudinary-cloud-name>"
CLOUDINARY_API_KEY="<your-cloudinary-api-key>"
CLOUDINARY_API_SECRET="<your-cloudinary-api-secret>"
```

4. Run the development server
   Using **npm**:

```bash
npm run dev
```

Using **bun** (if you prefer speed ⚡):

```bash
bun run dev
```

## Folder Structure

```
├── app
│   ├── css
│   │   ├── **/*.css
│   ├── favicon.ico
│   ├── images
│   ├── index.html
│   ├── js
│   │   ├── **/*.js
│   └── partials/template
├── lib
├── ├── utils.ts
├── node_modules
├── public
├── .gitignore
├── .bun.lock               # Lockfile for bun install
├── package.lock.json       # Lockfile for npm install
├── .components.json        # Shadcn UI Config
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── README.md               # README
└── tsconfig.json           # TypeScript configuration
```

## Usage

## Screenshot

## Template references for research
