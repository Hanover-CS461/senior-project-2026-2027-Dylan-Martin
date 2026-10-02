---
layout: default
---

# 8 — Summary and Further Reading

← [Prev: Practice Exercises](07-practice-exercises.html) · [Back to Contents](index.html)

You have built, entirely in the browser, the cryptographic core of an end-to-end-encrypted chat: two HTML pages that agree on a secret neither ever transmits, encrypt messages only the other page can read, and verify each other's keys before trusting them. This page compresses the whole tutorial into one mental model, lists the mistakes that break real implementations, points to the official documentation, and shows where the FRUM project picks up.

**By the end of this page you can:** give a 30-second elevator summary of the entire tutorial, and name the four security reminders from memory.

## The mental model

Eight pages, one pipeline. Each page added one stage, and each stage feeds the next:

```
page 1  secure context + bytes      the two rules every call obeys
page 2  hash  →  fingerprint        identify and verify data
page 3  symmetric key + AES-GCM     encrypt and detect tampering
page 4  key pairs + JWK             two keys: one to share, one to keep
page 5  ECDH → HKDF → AES key       agree on a secret without sending it
page 6  two pages, one exchange     the pipeline, wired into a real app
```

If you can explain how page 5 turns the key pairs of page 4 into the AES keys that page 3 needs — and why a hash from page 2 lets two peers on page 6 trust each other — you understand the whole arc. Everything else is API detail.

## What you can now do

- **Page 1** — explain why `crypto.subtle` demands a secure context, and why `localhost` counts while `file://` does not. Every call returns a Promise; every input is a `BufferSource`, never a string.
- **Page 2** — hash anything to a 32-byte SHA-256 digest, format it as 64 hex characters, verify your pipeline against a known answer, and use the avalanche effect for change detection.
- **Page 3** — generate an AES-GCM key, encrypt and decrypt with a fresh 12-byte IV per message, and rely on the 16-byte authentication tag: tampered ciphertext throws `OperationError`.
- **Page 4** — generate ECDH key pairs, export and import public keys as JWK, and keep private keys non-extractable.
- **Page 5** — derive the raw shared secret with ECDH, feed it through HKDF with shared `salt` and `info`, and produce a real AES key both sides agree on.
- **Page 6** — wire it all into two HTML pages, exchange keys by hand, and move messages as `{ iv, encryptedMessage }` JSON that only the other page can decrypt.

## The four security reminders

Each one is a mistake real products have shipped. If you remember nothing else, remember these:

1. **A fresh IV for every message — never reuse an (IV, key) pair.** GCM's keystream repeats, and an attacker who sees both ciphertexts can recover plaintext. ([page 3](03-symmetric-encryption.html#prepare-the-iv) · NIST SP 800-38D)
2. **Never use raw ECDH output as a key.** The naive ECDH→AES `deriveKey` works. Run the shared secret through a KDF (HKDF) for domain separation. ([page 5](05-key-agreement.html#the-footgun-raw-output-is-not-a-key) · NIST SP 800-56A)
3. **Keep private keys non-extractable.** `extractable: false` means the `d` field never leaves the browser, not even for your own code. ([page 4](04-asymmetric-keys.html#what-extractable-actually-governs))
4. **A secure context or nothing.** Serve over `localhost` or HTTPS; a `file://` page is not a trustworthy place to run cryptography. ([page 1](01-getting-started.html#why-a-secure-context))

And the trust habit that uses all four: **verify fingerprints out of band.** Hash the peer's public key, compare the hex over a trusted channel, and only then exchange secrets. ([page 6](06-putting-it-together.html#verify-the-fingerprint-first))

## See also — official documentation

- [SubtleCrypto — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) — the full reference for every method in this tutorial
- [Web Cryptography API — W3C Recommendation](https://www.w3.org/TR/WebCryptoAPI/) — the standard itself
- [NIST SP 800-56A Rev. 3 — Pair-Wise Key Establishment](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final) — why raw ECDH output needs a KDF (page 5)
- [RFC 5869 — HKDF](https://www.rfc-editor.org/rfc/rfc5869) — the key derivation function page 5 uses
- [RFC 7517 — JSON Web Key (JWK)](https://www.rfc-editor.org/rfc/rfc7517) — the portable key format from page 4
- [NIST SP 800-38D — Galois/Counter Mode (AES-GCM)](https://csrc.nist.gov/pubs/sp/800/38d/final) — the IV rules from page 3
- [Secure Contexts — MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) — the ground rule from page 1

## Where to go next — the road to FRUM

This tutorial stops exactly where the FRUM project starts:

- **Key storage.** `CryptoKey` objects are structured-cloneable, so a key pair can live in **IndexedDB** and survive page reloads — closing the one gap you saw on page 6, where reloading a page invalidated the other side's imported key. Keep `extractable: false`; IndexedDB stores the opaque handle, not the key material.
- **Transport.** The page-6 wire format (`{ iv, encryptedMessage }`) is already one JSON message. Replace copy-paste with a **WebSocket** relay: the server forwards ciphertext it cannot read. That is the FRUM architecture — an untrusted relay between two browser endpoints.
- **Verification.** Real deployments need an out-of-band fingerprint channel — QR codes, voice, a printed key — so trust on first use has somewhere to start.
- **The project itself.** The FRUM document ([FRUM](../FRUM.html)) describes the full chat application this tutorial's crypto is the core of: key pairs stored client-side, shared secrets derived per conversation, and a server that only ever touches public keys, IVs, and ciphertext.

## The 30-second elevator summary

Memorize this. It is the whole tutorial:

> The Web Crypto API puts audited, native cryptography in every browser — no libraries, no build step. Hash with SHA-256 to fingerprint and verify data. Encrypt messages with AES-GCM: a fresh IV per message, and the 16-byte tag makes any tampering throw `OperationError`. For two parties who have never met, generate ECDH key pairs, exchange public keys as JWK, and derive a shared secret — then never use those raw bits directly: feed them through HKDF with a shared salt and purpose string to get a real AES key. Keep private keys non-extractable, run everything in a secure context, and verify public keys by fingerprint out of band. The result is two HTML pages and no trusted server: messages only the other party can read.

## Final check

1. Say the elevator summary out loud, without looking (does not need to be word for word).
2. Name the four security reminders and explain each in one sentence.
3. Explain why page 5's footgun is "the wrong way works" — and why that makes it dangerous.
4. Point at a page of the tutorial and explain what would break if you removed it from the pipeline.

If you can do all four, you have met every objective in the [table of contents](index.html). The next step is the FRUM project — where this cryptography becomes a chat application.

← [Prev: Practice Exercises](07-practice-exercises.html) · [Back to Contents](index.html)
