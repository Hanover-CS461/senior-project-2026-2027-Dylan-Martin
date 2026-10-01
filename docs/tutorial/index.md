---
layout: default
---

# Cryptography in the Browser: A Web Crypto API Tutorial

Every modern browser ships a native cryptography engine, and the **Web Crypto API** (the `crypto.subtle` interface) exposes it directly: hash data, encrypt and decrypt messages, generate key pairs, and derive shared secrets — all with native, audited implementations. No third-party libraries, no build step, no framework, no backend. This tutorial takes you from your first `crypto.subtle` call to a complete two-party encrypted message exchange — the cryptographic core of an end-to-end-encrypted chat application — and it teaches you the mistakes that break real-world implementations along the way.

## Target audience

This tutorial is for **web developers who write JavaScript comfortably** — you should be at home with `async`/`await`, functions, and the browser DevTools console — **and who understand cryptography at a conceptual level**: you know what a public key, a private key, and symmetric versus asymmetric encryption are, or you have **no** prior crypto-*API* experience, and you do **not** need React, Node.js, a bundler, or any third-party package. If you can open a browser console, you can follow along.

The tutorial is written to be *run*, not read — every page ends with a hands-on checkpoint that pushes you to retype, predict, break, and rebuild the code. By page 6 you will have built and run a working two-party encrypted exchange in your browser.

## Prerequisites

To follow along you need:

- **A modern browser** — a recent Chrome, Edge, Firefox, or Safari. The Web Crypto API is stable and widely supported.
- **Basic JavaScript** — promises and `async`/`await`, functions, and `console.log` debugging. You will use the DevTools console throughout.
- **Conceptual cryptography knowledge** — what encryption and decryption mean, what a key pair is, and roughly how public-key exchange works. No math required.
- **Python 3 or Node.js** — for a static local server. Page 1 shows the exact command (`python3 -m http.server 8000`). This is required because the Web Crypto API only runs in *secure contexts* (more on that in [Getting Started](01-getting-started.html)).
- **About 20–30 minutes per page** — the checkpoints are the tutorial; budget time to actually run them.

You do **not** need: npm installs, a framework, a build tool, a backend, or any cryptography library.

## Learning objectives

By the end of this tutorial you will be able to:

1. Explain why the Web Crypto API requires a secure context, and verify it in your browser.
2. Hash data with SHA-256 and format digests as hex.
3. Encrypt and decrypt with AES-GCM, using a fresh IV per message.
4. Detect tampered ciphertext via GCM's authenticated-encryption guarantee.
5. Generate ECDH key pairs and control key export with the `extractable` flag.
6. Export public keys as JWK to share them, and import a peer's public key.
7. Derive a shared secret with ECDH, then turn it into a proper AES key with HKDF — following the key-derivation rules of NIST SP 800-56A.
8. Assemble everything into a two-party encrypted message exchange between two HTML files.

## How this tutorial works

The tutorial is eight pages, meant to be read in order. Pages 1–5 and 7 run entirely in the browser console; page 6 is where you create two HTML files and run the full exchange; page 8 summarizes and points to official documentation.

Work through each page with the same loop:

1. **Read** the section and its code block.
2. **Retype** the snippet into your console.
3. **Predict** the output before pressing Enter, then check.
4. **Break it** — change an input, delete an argument, observe the failure.
5. **Rebuild** the key snippets from memory after finishing the page.
6. **Explain** each page's concept in your own words before moving on. If you cannot explain it, you have not learned it yet.

Every page ends with a **Hands-on checkpoint** built from this loop.

## Contents

| Page | Topic | What you do | Status |
|---|---|---|---|
| [1 — Getting Started](01-getting-started.html) | Secure contexts, your first call | Console probes | Ready |
| [2 — Hashing with SHA-256](02-hashing.html) | `digest()`, hex, fingerprints | Console snippets | Ready |
| [3 — Symmetric Encryption with AES-GCM](03-symmetric-encryption.html) | `generateKey`, IVs, tamper detection | Console snippets | Ready |
| [4 — Asymmetric Keys with ECDH](04-asymmetric-keys.html) | Key pairs, `extractable`, JWK | Console snippets | Ready |
| [5 — Deriving a Shared Secret](05-key-agreement.html) | ECDH + HKDF, the NIST SP 800-56A footgun | Console snippets | Ready |
| 6 — Putting It Together | Two-party encrypted exchange | Two HTML files | Coming soon |
| 7 — Practice Exercises | Test yourself | Console exercises | Coming soon |
| 8 — Summary and Further Reading | Recap and official docs | Read | Coming soon |

## About the examples

Every code block in this tutorial is complete and runnable, and every *deterministic* output (such as a SHA-256 digest) was verified against published reference values before being printed. Where output is random by design — AES-GCM ciphertext, derived keys — the expected results are shown structurally, and the checkpoints teach you to verify correctness by round-trip instead. All cryptography happens locally in your browser; nothing is ever sent anywhere.

Start with [Page 1: Getting Started](01-getting-started.html) →
