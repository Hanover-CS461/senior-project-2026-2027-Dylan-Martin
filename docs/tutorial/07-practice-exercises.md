---
layout: default
---

# 7 — Practice Exercises

← [Prev: Putting It Together](06-putting-it-together.html) · [Next: Summary and Further Reading →](08-summary-and-further-reading.html)

**The rules:**

1. Attempt each exercise from memory — no looking at earlier pages, no looking at the hints.
2. Use a hint only after you have genuinely tried and gotten stuck.
3. Hints link to the exact section that teaches the missing piece; they contain no solutions.
4. **Done when:** you can solve all four with no hints at all.

**In this page you will review:**

- Tamper detection with AES-GCM and the `OperationError` contract
- Deriving a shared secret from *fixed* key material
- What `extractable` actually controls — and the error when you fight it
- Fingerprints: hashing a public key, comparing, and catching a swapped key

## Exercise 1 — Tamper detection round-trip

**The task.** From memory: generate an AES-GCM key, encrypt your own name with a fresh 12-byte IV, decrypt it, and confirm it comes back intact. Then modify a byte of the ciphertext and decrypt again.

Do it in this order, without looking:

1. The whole round-trip from memory: `generateKey` → fresh IV → `encrypt` → `decrypt` → `TextDecoder`. Verify you get your name back.
2. **Predict** the error name *before* the second decrypt.
3. Modify the ciphertext. Remember `ArrayBuffer` is not mutable — wrap it in a `Uint8Array` view first, then flip a byte.
4. Read the error the browser throws.

**Predict first:** what will happen if you tamper with the *last* byte instead of the first? Does the position matter?

**Hint** → [03-symmetric-encryption.html#tamper-with-the-ciphertext](03-symmetric-encryption.html#tamper-with-the-ciphertext) · if the round-trip itself will not come back: [03-symmetric-encryption.html#decrypt](03-symmetric-encryption.html#decrypt)

## Exercise 2 — Derive a shared secret from a fixed keypair

This is page 5's determinism proof, run twice. The twist: instead of generating fresh pairs, you will **fix** keypair once, save it, reload the console, and derive from the saved keys — the same inputs must produce the same secret every time.

**Part A — fixed keys.** Generate two ECDH pairs with `extractable: true` (yes, for this exercise only), and export all four keys as JWK — *including the private keys*, which normally stay home. Save the JWKs somewhere persistent: a text file, a comment, a second console.

**Part B — reload the console** and import all four keys back from the saved JWKs. Importing a private key uses the same five-argument `importKey` as page 4, with usages `['deriveKey', 'deriveBits']` — the JWK's `key_ops` must allow them.

**Part C — derive both directions** with `deriveBits`, format with `toHex`, and compare. Then run it *again* — same secret? Now wrap the shared secret in HKDF (same `salt` and `info` on both sides, from memory) and derive an AES key for each side, then prove the two AES keys agree with a cross-encrypt/decrypt, exactly like page 5's proof.

**Predict first:** will the two directions produce the same 64 hex characters? Will the second run match the first?

**Hint** → [05-key-agreement.html#two-pairs-one-secret](05-key-agreement.html#two-pairs-one-secret) · stuck on the private JWK, or on import? [04-asymmetric-keys.html#the-private-key-stays-home](04-asymmetric-keys.html#the-private-key-stays-home)

## Exercise 3 — Non-extractable export rejection

**The task.** From memory: generate an ECDH key pair with `extractable: false`, then try to export the *private* key as JWK.

1. **Predict the error name** before running. If you do not remember it, that is exactly the skill this exercise is testing.
2. Generate a *second* pair with `extractable: true` and export its private key. What new field appears in the JWK, and what does it mean?
3. Explain out loud: in both cases, could you export the *public* key? Why is the public key always exportable?

**Predict first:** the exact error name, and the name of the field that appears only for the exportable private key.

**Hint** → [04-asymmetric-keys.html#what-extractable-actually-governs](04-asymmetric-keys.html#what-extractable-actually-governs) · for the `d` field: [04-asymmetric-keys.html#the-private-key-stays-home](04-asymmetric-keys.html#the-private-key-stays-home)

## Exercise 4 — Fingerprint comparison

**The task.** Pages 2, 4, and 6 in one exercise.

1. Generate an ECDH pair, export the public key as JWK, and hash `JSON.stringify(jwk)` with SHA-256. Format with `toHex` — that hex string is the fingerprint.
2. Generate a *second* pair and hash its public JWK the same way. **Predict:** do the two fingerprints share any visible structure?
3. Copy the first JWK, change one character inside `x` or `y`, and hash again. **Predict** how much of the fingerprint changes.
4. Explain out loud (or to someone): if Alice publishes her fingerprint and Bob hashes the key he actually received, what does a mismatch prove — and what does a match prove? (This is page 6's trust model.)

**Hint** → [02-hashing.html#fingerprints](02-hashing.html#fingerprints) · [04-asymmetric-keys.html#your-public-keys-fingerprint](04-asymmetric-keys.html#your-public-keys-fingerprint) · [06-putting-it-together.html#verify-the-fingerprint-first](06-putting-it-together.html#verify-the-fingerprint-first)

## How you did

- **All four with no hints** — you have consolidated pages 1–6. Page 8 wraps up and points onward.
- **One or two hints** — go back to the linked sections, retype their key snippets from memory, then retry the exercise.
- **More than two hints** — that is normal for a first pass. Work through the linked sections again, then redo the exercises a day later.

← [Prev: Putting It Together](06-putting-it-together.html) · [Next: Summary and Further Reading →](08-summary-and-further-reading.html)
