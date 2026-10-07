# AGENTS.md

## State of this repo

CS461 senior project (single-owner academic repo). The frontend has started; the backend has not.

- `FRUM/frontend/React/` is a working Vite + React 19 + TypeScript app with its own `package.json` (`dev`, `build`, `lint`, `preview`) and `oxlint` config. This is the only package manifest — there is still no root `package.json`, and no CI (`.github/workflows/` is empty).
- `FRUM/backend/` exists but is empty; the Node.js/WebSocket relay has not been started.
- `docs/FRUM.md` is the source of intent for the overall system. It sketches an end-to-end-encrypted real-time web chat (React + Node.js/WebSockets + MongoDB) and a secondary game idea. Treat its stack choices as proposals, not settled decisions.
- `docs/WELCOME-PAGE.md` is the settled design brief for the Victorian-styled welcome page (palette, typography, logo treatment, interaction). Follow it when building that page.
- Run the frontend from its own directory: `cd FRUM/frontend/React && npm run dev`. There is no root-level script.
- Don't scaffold new top-level projects or add root-level dependencies without confirming direction first.

## OpenCode setup

- `opencode.json` sets `default_agent: deliberate`, and custom agents are defined in `.opencode/agents/` (`deliberate.md`, `coach.md`). Read the relevant agent file before assuming default OpenCode behavior — they override defaults for this repo (e.g., deliberate mode is read-only except `.md` files, bash denied; coach mode is Socratic, edit denied).
- `.opencode/` holds OpenCode's own vendored plugin dependency (`@opencode-ai/plugin` in its local `package.json`/`node_modules`). That directory is gitignored tooling, not project code — never treat it as the project's dependency tree or add to it.

## Conventions

- The only file type agents are permitted to write here is Markdown (per the deliberate agent's edit rules). Editing code (`.tsx`, `.css`, `.gitignore`, etc.) requires an edit-capable session.
- The Vite dependency cache must be ignored, not committed. `FRUM/.vite/` and `FRUM/frontend/.vite/` currently exist and `FRUM/.gitignore` does not list `.vite` — add it in a build session.
- If the user asks to deliberate, keep sessions in planning mode — do not proactively propose scaffolding or implementation.
