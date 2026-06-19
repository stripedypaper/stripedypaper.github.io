# Trickcal Tier List

Static GitHub Pages frontend plus an AWS Lambda/API Gateway backend for Discord OAuth.

## Current behavior

- Shows a blank login test page.
- Sends users to Discord OAuth.
- Displays the logged-in Discord user after the backend session is present.
- Logs out by clearing the backend session cookie.

## Values needed

To finish wiring this up, provide:

- Discord application client ID.
- Discord application client secret.
- AWS region to deploy into.
- Final GitHub Pages URL, likely `https://stripedypaper.github.io/trickcal-tier-list/`.

The backend deployment will output a Discord redirect URL. Add that exact URL to the Discord application's OAuth2 redirect URLs, then set `apiBaseUrl` in `config.js` to the backend API URL.

## Backend deployment sketch

From `trickcal-tier-list/backend`:

```powershell
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
2. Copy the `ApiBaseUrl` output into `trickcal-tier-list/config.js`.
3. Commit and push this folder to GitHub Pages.

## Local testing

From the repo root:

```powershell
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/trickcal-tier-list/
```

The frontend sends the current page URL to `/auth/start` as `return_to`, so Discord login returns to localhost when you start from localhost and returns to GitHub Pages when you start from GitHub Pages.
