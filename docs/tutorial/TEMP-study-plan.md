---
---
# TEMP STUDY PLAN — Web Crypto API Tutorial

**Status:** working document · not part of the tutorial · delete before final submission.
**Purpose:** tells us what to learn and do on each page, so the tutorial flows and we (Dylan + opencode) can co-author it page by page.

---

## How we work together (per page)

1. **I explain** the concept and the API call (short, no page text yet).
2. **You do** the hands-on steps in the DevTools console: predict → run → break → retype.
3. **We co-write** the page: intro/objectives → sections → code blocks → recap → hands-on checkpoint.
4. **Page is done** when its "done when" test below passes.

## The fixed spec (already decided)

- **Topic:** the Web Crypto API (`crypto.subtle`) in the browser — the crypto core of the FRUM project.
- **Format:** code-only (no screenshots). Console snippets on pages 1–5 and 7; two HTML files on page 6.
- **Tooling:** nothing to install beyond a browser + `python3 -m http.server 8000`.
- **Structure:** 8 pages; `index.md` is the TOC; every page has prev/next links.
- **Rubric target:** A (4). Check each box as we go.

## Rubric checklist (A)

- [ ] Target audience clearly stated in the intro (index)
- [ ] Prerequisites section (index)
- [ ] Learning objectives (index + each page)
- [ ] Multiple files; index = table of contents
- [ ] Prev/next links on every page
- [ ] Fragment links (`page.html#section`) where useful
- [ ] Language-tagged code blocks (` ```js `, ` ```console `, ` ```html `)
- [ ] Inline links to official docs at the point of use
- [ ] "See also" section with official docs (page 8)
- [ ] At least 2 practice exercises (page 7)
- [ ] Summary/conclusion page (page 8)
- [ ] Clean grammar throughout
- [ ] Someone with the prereqs can follow it — TEST page 6 in two browser windows
- [ ] Images: N/A (code-only)

---

## Page-by-page plan

### Page 1 — Getting Started (secure contexts, localhost, first call)

- **Learn:** what a secure context is and why `crypto.subtle` requires one · `localhost` counts, `file://` does not · API shape: all methods return Promises, input is `BufferSource` (never raw strings).
- **Do:** serve the folder with `python3 -m http.server 8000` · run `window.crypto?.subtle` on localhost and on an HTTPS site · explain the `file://` problem out loud.
- **Page needs:** objectives · serve command · availability check · method table · recap + checkpoint.
- **Done when:** you can answer "why localhost and not file://" without looking.

### Page 2 — Hashing (SHA-256)

- **Learn:** `TextEncoder` → `crypto.subtle.digest()` → `ArrayBuffer` → hex · avalanche effect · fingerprints.
- **Do:** hash `hello world` (check `b94d27b9…`) · your name · one-char change · empty string (starts `e3b0c442…`).
- **Page needs:** `toHex` helper · known-answer values (VERIFY before printing) · fingerprint bridge to TOFU · recap + checkpoint.
- **Done when:** you can write `toHex` from memory.

### Page 3 — Symmetric Encryption (AES-GCM)

- **Learn:** `generateKey` (extractable flag) · random IV via `crypto.getRandomValues` · `encrypt`/`decrypt` · authenticated encryption: ciphertext = plaintext + 16-byte tag · tampering → `OperationError`.
- **Do:** round-trip encrypt/decrypt · flip a byte, watch it fail · encrypt twice, note the ciphertext differs (IV) · never reuse an IV.
- **Page needs:** full round-trip block · tamper block · "why output differs each run" callout · recap + checkpoint.
- **Done when:** you can explain why GCM output is different every run.

### Page 4 — Asymmetric Keys (ECDH) + JWK

- **Learn:** `generateKey` ECDH P-256 · `extractable` true/false · `exportKey('jwk', …)` → `{kty, crv, x, y}` · `importKey` of a peer's public key · non-extractable private key rejects export.
- **Do:** generate a pair · export the public JWK · import it back · generate with `extractable: false` and watch `exportKey` throw.
- **Page needs:** keygen + export + import blocks · extractable discussion (private keys stay non-extractable in real apps) · recap + checkpoint.
- **Done when:** you can read a JWK and say what each field means.

### Page 5 — Deriving a Shared Secret (the meat)

- **Learn:** `deriveBits` gives the raw ECDH shared secret · **NIST SP 800-56A footgun: never use raw ECDH output as a key** · Web Crypto applies NO KDF in ECDH `deriveKey` (verified: `EcdhKeyDeriveParams` = `{ name, public }` only, no hash) · the proper path: `importKey` the raw secret as HKDF material → `deriveKey` with HKDF + SHA-256 → AES-GCM key · salt/info are shared (not secret) and must match on both sides.
- **Do:** Alice + Bob keypairs in one console · `deriveBits` both ways, hex-compare — same 32 bytes · import raw secret as HKDF key · `deriveKey` HKDF→AES-GCM on both sides · prove equality by exporting both derived keys as JWK (needs `extractable: true` on the derived keys) and comparing.
- **Page needs:** deriveBits block + equality proof · footgun callout with NIST link · HKDF import + derive blocks · recap + checkpoint.
- **Done when:** you can explain the footgun to someone who hasn't read the page.

### Page 6 — Putting It Together (two HTML files)

- **Learn:** wiring the API into real pages · public key exchange · fingerprint verification (SHA-256 of the peer JWK).
- **Do:** create `alice.html` + `bob.html` from the page's code · serve · open two windows · paste each other's public keys · exchange encrypted messages · compare fingerprints.
- **Page needs:** full ` ```html ` blocks for both files · run instructions · expected behavior. **Must actually run — this is the rubric's "someone can follow" test.**
- **Done when:** two windows exchange a message and fingerprints match. (Note: I can only write `.md` — you create the `.html` files and test them.)

### Page 7 — Practice Exercises

- **Learn:** nothing new — consolidate pages 1–5.
- **Do:** 4 exercises: (1) tamper-detection round-trip · (2) derive a shared secret from a fixed keypair · (3) non-extractable export rejection · (4) fingerprint comparison.
- **Page needs:** prompts + hints (fragment links back to the relevant page) · no full solutions.
- **Done when:** you can solve all 4 from memory.

### Page 8 — Summary + See Also

- **Learn:** the mental model — hash → symmetric → asymmetric → key agreement.
- **Page needs:** summary · security reminders (IV reuse, raw ECDH bits, extractable, secure context) · **See also**: MDN SubtleCrypto, W3C WebCryptoAPI spec, NIST SP 800-56A · "where to go next" (IndexedDB key storage, WebSocket transport — FRUM).
- **Done when:** you can give a 30-second elevator summary of the whole tutorial.

---

## Final submission checklist

- [ ] Delete this file (`TEMP-study-plan.md`)
- [ ] Link the tutorial from `docs/index.md`
- [ ] Push to `main`; confirm GitHub Pages renders prev/next + syntax highlighting
- [ ] Verify page 6 works in two browser windows
