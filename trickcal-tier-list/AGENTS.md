# Repo Notes

This repo contains a Vite/React frontend in `src/` and an AWS SAM backend in `backend/`.

## Common Commands

- `npm install`
- `npm run dev` — starts Vite locally at `http://localhost:8000/index.src.html`.
- `npm run build` — builds the frontend from `index.src.html` without leaving the source entry copied over `index.html`.
- `npm run lint` — runs Prettier check.
- `npm run format` — rewrites files with Prettier.
- `cd backend; sam build` — builds the Lambda bundle.

## Local Ports

- Vite should run on port `8000` when possible.
- Backend OAuth redirect testing assumes `http://localhost:8000`.

## App Structure

- `src/App.jsx` should stay thin; move page logic into `src/pages/`.
- Shared UI helpers belong in `src/components/`, `src/hooks/`, or `src/lib/`.
- Admin sub-pages belong under `src/pages/admin/`.
- Keep `Manage Users` and `Manage Characters` separated into their own modules.

## Backend Notes

- Auth and admin checks live in `backend/src/auth.mjs` and `backend/src/oauth.mjs`.
- User data is stored in DynamoDB `UsersTable`.
- Character data is stored in DynamoDB `CharactersTable`.
- Character images are uploaded to S3 and served through CloudFront.
- Character image URLs should be cache-busted when an image is re-uploaded.

## Deployment Notes

- Defer to the user when deployment is needed

## Workflow

- Keep changes focused and minimal.
- Run `npm run lint` and `npm run build` before finishing frontend work.
- Run `sam build` before finishing backend work.
- Do not commit or push unless explicitly instructed.
- Avoid checking in generated artifacts such as `dist/` or `node_modules/`.
- GitHub Pages publishes from the CI artifact defined in `.github/workflows/deploy-pages.yml`.
- `npm run pages:build` is for local verification of the Pages output tree; built publish artifacts such as `assets/` should not be committed.
- `index.src.html` is the source Vite entry file; `index.html` is the checked-in GitHub Pages publish file.
