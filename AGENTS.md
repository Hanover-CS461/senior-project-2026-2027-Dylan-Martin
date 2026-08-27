# AGENTS.md

## State of this repo

Planning-stage scaffold for a CS461 senior project (single-owner academic repo). There is **no application source code yet**: no root `package.json`, no build/test/lint tooling, no CI. Do not go looking for entrypoints, scripts, or tests — they do not exist.

- `proposal/ideas.md` is the current source of intent. It sketches an end-to-end-encrypted real-time web chat (React + Node.js/WebSockets + MongoDB) and a secondary game idea. The stack choices there are tentative proposals, not settled decisions — check this file before implementing anything.
- Don't scaffold a project or add root-level dependencies without confirming the stack direction first; it is undecided.

## OpenCode setup

- `opencode.json` sets `default_agent: deliberate`, and custom agents are defined in `.opencode/agents/` (`deliberate.md`, `coach.md`). Read the relevant agent file before assuming default OpenCode behavior — they override defaults for this repo (e.g., deliberate mode is read-only except `.md` files, bash denied; coach mode is Socratic, edit denied).
- `.opencode/` holds OpenCode's own vendored plugin dependency (`@opencode-ai/plugin` in its local `package.json`/`node_modules`). That directory is gitignored tooling, not project code — never treat it as the project's dependency tree or add to it.

## Conventions

- The only file type agents are permitted to write here is Markdown (per the deliberate agent's edit rules).
- If the user asks to deliberate, keep sessions in planning mode — do not proactively propose scaffolding or implementation.