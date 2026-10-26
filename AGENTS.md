# AGENTS.md

## State of this repo

CS461 senior project (single-owner academic repo). The frontend exists and a minimal Express server has been started; the WebSocket relay and database layer have not.

- `FRUM/frontend/React/` is a working Vite + React 19 + TypeScript app with its own `package.json` (`dev`, `build`, `lint`, `preview`) and `oxlint` config. There is no root `package.json` and no CI (`.github/workflows/` is empty).
- `FRUM/server/` is the backend (there is no `FRUM/backend/`): an Express 5 app with a `/api/signup` stub in `credentials.js`, plus its own `package.json`/`node_modules`. No WebSocket relay and no database layer yet.
- `docs/FRUM.md` is the source of intent for the overall system. It sketches an end-to-end-encrypted real-time web chat (React + Node.js/WebSockets + MongoDB) and a secondary game idea. Treat its stack choices as proposals, not settled decisions.
- `docs/WELCOME-PAGE.md` is the settled design brief for the Victorian-styled welcome page (palette, typography, logo treatment, interaction). Follow it when building that page.
- Run the frontend from its own directory: `cd FRUM/frontend/React && npm run dev`. There is no root-level script.
- Don't scaffold new top-level projects or add root-level dependencies without confirming direction first.

## Demo and deployment policy

- The demo is a one-time, in-person event; the app does not need to stay reachable afterward.
- Everything — the Vite frontend, the Express/WebSocket server, and MongoDB — runs on the demo laptop and is reached via `localhost`. Do not bind the server to the LAN IP for a demo: a browser on another machine loading `http://<lan-ip>` is not a secure context, so `crypto.subtle` is unavailable and the encryption core cannot run.
- Audience participation is verbal only, while the owner demonstrates. Do not plan for attendees to open the app on their own devices.
- Deployment (VPS + MongoDB Atlas) is optional post-demo polish, not a course requirement.

## MongoDB

- Runs locally on the dev/demo laptop as a standalone `mongod`; no replica set, because the design needs no multi-document transactions. Install method (native package vs Podman container) is not yet chosen.
- Store only what the threat model allows: usernames, argon2id password hashes, public keys, and short-lived ciphertext mailbox entries (expired by a TTL index). Never private keys or plaintext.
- The connection string comes from the untracked `FRUM/server/.env`; MongoDB stays bound to loopback with auth enabled. The browser never contacts MongoDB directly.

## OpenCode setup

- `opencode.json` sets `default_agent: deliberate`, and custom agents are defined in `.opencode/agents/` (`deliberate.md`, `coach.md`). Read the relevant agent file before assuming default OpenCode behavior — they override defaults for this repo (e.g., deliberate mode is read-only except `.md` files, bash denied; coach mode is Socratic, edit denied).
- `.opencode/` holds OpenCode's own vendored plugin dependency (`@opencode-ai/plugin` in its local `package.json`/`node_modules`). That directory is gitignored tooling, not project code — never treat it as the project's dependency tree or add to it.

## Conventions

- The only file type agents are permitted to write here is Markdown (per the deliberate agent's edit rules). Editing code (`.tsx`, `.css`, `.gitignore`, etc.) requires an edit-capable session.
- `FRUM/.gitignore` already ignores the Vite cache (`.vite/`). It does not yet ignore env files — add `.env`, `.env.*`, and `!.env.example` before any connection string exists; server config belongs in an untracked `FRUM/server/.env`.
- `FRUM/server/credentials.js` is currently the server entry point (`package.json` `main`) and holds placeholder data. Never put real secrets in it; rename it in a build session.
- If the user asks to deliberate, keep sessions in planning mode — do not proactively propose scaffolding or implementation.
