# Trickcal Tier List

Vite + React + Mantine frontend for the Trickcal Discord auth flow, plus the existing AWS Lambda/API Gateway backend.

Repository-specific working notes live in `AGENTS.md`.

## Frontend

- `npm install`
- `npm run dev`
- Open `http://localhost:8000/index.src.html`.

## Config

The app reads the API base URL from either:

- `public/config.json` at runtime
- `VITE_API_BASE_URL` at build time

The checked-in runtime config currently points at the deployed API URL. Update that file after redeploying the backend, or bake the value into your build environment.

## Build

```powershell
npm run build
```

The Vite base path is set to `/trickcal-tier-list/` for GitHub Pages deployment.

## GitHub Pages publish files

Use this command when you want to refresh the static files that are actually served from `https://stripedypaper.github.io/trickcal-tier-list/`:

```powershell
npm run pages:build
```

What it does:

- temporarily swaps in `index.src.html` as the Vite entry during build
- restores the checked-in publish `index.html` after the build finishes
- copies the built `index.html`, `config.json`, and `assets/` into the project root for GitHub Pages

After that, commit:

```powershell
git add trickcal-tier-list/index.html trickcal-tier-list/config.json trickcal-tier-list/assets
git commit -m "Commit built files for GitHub Pages"
```

## Format Check

```powershell
npm run lint
```

This runs Prettier against the HTML, JavaScript, and CSS files.

To auto-fix formatting:

```powershell
npm run format
```

## Backend

The backend lives in `backend/` and still uses AWS SAM.

```powershell
cd backend
sam build
sam deploy --guided `
  --parameter-overrides `
  DiscordClientId=YOUR_CLIENT_ID `
  DiscordClientSecret=YOUR_CLIENT_SECRET `
  FrontendUrl=https://stripedypaper.github.io/trickcal-tier-list/ `
  FrontendOrigin=https://stripedypaper.github.io `
  LocalFrontendOrigin=http://localhost:8000 `
  CookieSecret=GENERATE_A_LONG_RANDOM_SECRET
```

After deployment:

1. Copy the `DiscordRedirectUri` output into the Discord developer portal.
2. Copy the `ApiBaseUrl` output into `public/config.json` or set `VITE_API_BASE_URL`.
3. Add Discord user records to the DynamoDB users table using the `UsersTableName` output. The table uses `discordId` as the string partition key.
4. Use the `CharactersTableName` output for the characters table and `CharactersCdnBaseUrl` for image URLs.
5. Rebuild and publish the `dist/` output to GitHub Pages.
6. For this repo layout, use `npm run pages:build` and commit the generated root publish files instead of committing `dist/`.

## Authorization model

- The first login for a Discord ID creates a `user` row in the users table.
- `role` can be `user`, `manager`, or `admin`.
- `/auth/me` returns the signed-in Discord user plus `role` and `isAdmin`.
- The navbar only shows `Admin` for admin users.
- `GET /admin/users` returns a paginated user list and is restricted to admin users.
- `GET`, `POST`, and `PUT /admin/characters` manage the characters table and images.
- `backend/src/auth.mjs` exports `requireAuthenticatedUser` and `requireAdminUser` for future API routes.
