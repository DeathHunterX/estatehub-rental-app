# EstateHub web app

This folder contains the Next.js application for visitors, tenants, and property managers. For the full setup, database requirements, and all three services, see the [project README](../README.md).

## Folder guide

| Path | Purpose |
| --- | --- |
| `src/app/` | Pages and layouts; route-specific components live beside their pages in `_components/` |
| `src/components/ui/` | Reusable interface primitives |
| `src/components/shared/` | Components used across routes |
| `src/hooks/` | Reusable React hooks |
| `src/lib/` | Formatting, validation, PDF generation, and other browser utilities |
| `src/providers/` | Application-wide React providers |
| `src/services/` | Socket client setup |
| `src/states/` | Redux state and API calls |
| `src/types/` | Shared and generated TypeScript types |
| `public/` | Static images and PDF fonts |
| `tests/` | Web app tests |

## Local commands

From this folder, install dependencies with `npm install`, copy `.env.example` to `.env.local`, and fill in the local settings. Start the web app with `npm run dev`. Run `npm run lint` and `npx tsc --noEmit` to check the source. The API and socket service run separately as described in the project README.
