---
layout: default
---

# 1 — Getting Started: Secure Contexts and Your First Call

← [Home](index.html) · [Next: Hashing with SHA-256 →](02-hashing.html)

Cryptography is only as trustworthy as the code that performs it. This page explains the ground rule that prevents a malicious attacker from swapping code: the Web Crypto API only runs in **[secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)**. You will set up a local server, probe several different contexts from your browser console, and see the pattern for yourself — then you will meet the two habits (promises and byte buffers) that every later page builds on.

**In this page you will learn to:**

- Explain why `crypto.subtle` only exists in secure contexts
- Check whether a page counts as secure with [`window.isSecureContext`](https://developer.mozilla.org/en-US/docs/Web/API/window/isSecureContext)
- Serve a folder over `localhost` and use the API across several contexts
- Describe the two rules that shape every Web Crypto call: promises and `BufferSource`

## Why a secure context?

`window.crypto` exists on every page, but it has two very different parts:

| Part | Available where | Purpose |
|---|---|---|
| [`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) | everywhere | Random numbers — you will use these for IVs on page 3 |
| `crypto.subtle` | secure contexts only | All real cryptography: hashing, encryption, key agreement |

Try the follwing in any console (My shortcut is ctrl + shift + I):

```js
window.crypto.subtle
// on a secure page → SubtleCrypto { digest: ƒ, generateKey: ƒ, ... }
// on an insecure page → undefined
```

### The integrity argument

The reason for the restriction is *code integrity*. A secure context (HTTPS, or `localhost`) guarantees the page's code arrived over an authenticated, encrypted connection — a network attacker cannot silently replace the JavaScript that performs your encryption with their own version. Without that guarantee, encrypting in the browser is worthless: whatever strength your algorithm has, the swapped-in code can simply send the plaintext to the attacker before encrypting it.

It does not matter how strong the vault is if the locksmith who installed it was replaced by a spy. TLS is the seal that proves you got the real locksmith.

**Caveat:** a secure context is *not* a secure page. HTTPS stops network attackers from modifying code in transit, but it does not stop cross-site scripting (XSS), malicious browser extensions, or compromised dependencies — all of which can still read your data before it is encrypted. A secure context is necessary, not sufficient.

## Set up a local server

Make a folder for the tutorial and serve it:

```console
$ mkdir webcrypto-tutorial
$ cd webcrypto-tutorial
$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Now open <http://localhost:8000> — a plain directory listing is fine. Your existing Jekyll site at <http://localhost:4000> also counts: **every** `localhost` port is a secure context.

## The experiment: probe every context

Rather than taking the rule on faith, verify it. Open a console on each context below and run the two commands:

```js
window.isSecureContext;
// true when secure, false when not

window.crypto.subtle;
// SubtleCrypto object when secure, undefined when not
```

| Context | Where to find it | `isSecureContext` | `crypto.subtle` |
|---|---|---|---|
| `http://localhost:8000` | the server you just started | ? | ? |
| `http://localhost:4000` | your Jekyll dev server | ? | ? |
| `https://developer.mozilla.org` | any HTTPS site | ? | ? |
| `file://` | right-click an `.html` file → open in browser | ? | ? |

Before you run the commands, predict each row. Then fill in the table and look at the pattern: **wherever `isSecureContext` is `true`, `crypto.subtle` exists.** The plain-`http://` row being hard to fill in is the same rule working at web scale — HTTPS became the default because the integrity argument won.

### What about file://?

Opening an HTML file directly from disk is not as clear as it should be. Browsers do not all agree on whether `file://` counts as a secure context — some treat it as one because the file came straight from your own machine (no network attacker in transit), and others do not. Even where it works, file pages behave inconsistently in other ways (module scripts, `fetch`, and more). The rule for this tutorial: **always serve over `localhost`**, where every browser agrees.

## The shape of the API

Two rules govern every call you will make on the remaining pages.

### Rule 1: every function returns a Promise

Every [`crypto.subtle`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) function is asynchronous and returns a **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** — a placeholder for a value that does not exist yet. You use `await` to get the value. The reason is that cryptographic operations are slow: generating a key can take real time, and if the browser ran it synchronously, the page would freeze until it finished. A promise lets the work happen without blocking the main thread. A promise has three states — *pending*, *fulfilled*, *rejected* — and `await` hands you the fulfilled value or throws the rejection.

```js
const result = await crypto.subtle.digest('SHA-256', new Uint8Array());
console.log(result); // an ArrayBuffer — never a string
```

The full menu of `crypto.subtle` functions, in the order this tutorial uses them:

| Function | What it does | Page |
|---|---|---|
| `digest()` | Hash data (SHA-256) | 2 |
| `generateKey()` | Create a key or key pair | 3, 4 |
| `encrypt()` / `decrypt()` | AES-GCM encryption | 3 |
| `exportKey()` / `importKey()` | Move keys in and out of the browser (JWK) | 4 |
| `deriveKey()` / `deriveBits()` | Compute a shared secret from key pairs | 5 |

(`sign`/`verify` and `wrapKey`/`unwrapKey` also exist but are out of scope here.)

### Rule 2: data is always bytes, never strings

Every function that takes data expects a **[`BufferSource`](https://developer.mozilla.org/en-US/docs/Web/API/BufferSource)**: an `ArrayBuffer`, or a *view* of one such as `Uint8Array`. Plain strings are rejected with a `TypeError`: 

- **Strings are ambiguous.** The same text can be encoded as UTF-8, UTF-16, and so on. An API that accepted strings would have to guess an encoding. A `BufferSource` is an unambiguous byte buffer.
- **The rest of the crypto world works in bytes.** OpenSSL, NIST test vectors, and every language's crypto module all operate on raw bytes. Web Crypto matches them, so the known-answer checks in this tutorial will match published values exactly.
- **You stay in control.** You decide the encoding — convert strings to bytes with `TextEncoder` (first used on page 2), and bytes back with `TextDecoder`. Server will never do this for you.

## Recap

- `crypto.subtle` exists only in **secure contexts**; `crypto.getRandomValues` exists everywhere.
- A secure context guarantees code integrity in transit — **necessary, not sufficient** (XSS still applies).
- `file://` is not reliable across browsers: **always serve over `localhost`**.
- `python3 -m http.server 8000` needs no `sudo`; every `localhost` port is secure.
- `window.isSecureContext` tells the truth, and `crypto.subtle` follows it.
- Every `crypto.subtle` call returns a **Promise**; every input is a **`BufferSource`** — never a string.

## Hands-on checkpoint

Do these in order — retype, predict, break, rebuild.

1. Retype the two probes (`window.isSecureContext`, `window.crypto?.subtle`) into your console from memory, and confirm the pattern on at least two of the four contexts.
2. Predict each row of the context table *before* running it. Write your predictions down, then check them.
3. Answer out loud: why is a secure context not a secure page? Name one attack that HTTPS does not stop.
4. Without looking, explain why a page running encryption over plain HTTP is worrisome — what can an attacker do to the code?
5. Predict: will `crypto.subtle.digest` accept the string `"hi"`? Run it and read the error. (The correct form is on the next page.)

← [Home](index.html) · [Next: Hashing with SHA-256 →](02-hashing.html)
