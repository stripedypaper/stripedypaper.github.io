# Trickcal Tier List

Vite + React + Mantine frontend for the Trickcal Discord auth flow, plus the existing AWS Lambda/API Gateway backend.

## Frontend

- `npm install`
- `npm run dev`
- Open the local Vite URL shown in the terminal.

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
    LocalFrontendOrigin=http://localhost:5173 `
    CookieSecret=GENERATE_A_LONG_RANDOM_SECRET
```

After deployment:

1. Copy the `DiscordRedirectUri` output into the Discord developer portal.
2. Copy the `ApiBaseUrl` output into `public/config.json` or set `VITE_API_BASE_URL`.
3. Rebuild and publish the `dist/` output to GitHub Pages.
