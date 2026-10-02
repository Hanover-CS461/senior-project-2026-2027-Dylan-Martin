---
layout: default
---

# 2 — Hashing with SHA-256

← [Prev: Getting Started](01-getting-started.html) · [Next: Symmetric Encryption with AES-GCM →](03-symmetric-encryption.html)

Hashing is the simplest operation in the Web Crypto API and the perfect place to start, because it exercises the whole pipeline — string → bytes → digest → hex — without any key management. By the end of this page you will have hashed real data, verified your pipeline against a published value, and met the *fingerprint*, the concept behind peer verification in end-to-end-encrypted chat.

**In this page you will learn to:**

- Encode strings as bytes with `TextEncoder`
- Hash bytes with `crypto.subtle.digest()`
- Format a digest as hex with a readable `toHex()` helper
- Verify your pipeline against a published SHA-256 value
- See the avalanche effect in action
- Explain what a fingerprint is and why it is safe to share

## What hashing gives you

A hash function takes any amount of data and produces a fixed-size digest — SHA-256 always produces **32 bytes**, whether you hash one character or a whole novel. Hashing has three properties you will rely on:

- **One-way.** You cannot recover the input from the digest. Hashing is *not* encryption — there is no key and no decryption.
- **Deterministic.** The same input always produces the same digest.
- **Avalanche.** Change any part of the input, even one character, and the digest changes completely.

Those three properties are exactly what you want when you need to *identify* a piece of data without revealing it — which is what a fingerprint is.

## Step 1 — Turn the string into bytes

Hashing works on bytes, not text. Before anything else, convert the string with `TextEncoder`. Note what `TextEncoder` actually is: a built-in browser function that converts a **string into its UTF-8 bytes**. `TextEncoder` exists because of the rule from [page 1](01-getting-started.html#rule-2-data-is-always-bytes-never-strings): `crypto.subtle` accepts a `BufferSource`, never a string.

```js
const bytes = new TextEncoder().encode('hello world');
console.log(bytes);
// Uint8Array(11) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
```

The result is a `Uint8Array` — an array of **bytes**, numbers from 0 to 255 (104 is `h`, 101 is `e`, and so on). Notice the unit: *bytes*, not bits. You will never handle individual bits in this tutorial.

- **Official documentation:** [`TextEncoder` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) · [`BufferSource` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/BufferSource)

## Step 2 — Hash the bytes

Pass the bytes to `crypto.subtle.digest()`:

```js
const digest = await crypto.subtle.digest('SHA-256', bytes);
console.log(digest);
// ArrayBuffer(32) {}
```

The first argument is the algorithm — `'SHA-256'` (a string) is shorthand for `{ name: 'SHA-256' }`. The call returns a Promise (page 1, Rule 1), so `await` is required.

The result is an `ArrayBuffer` of exactly 32 bytes, no matter how long the input was. But `console.log` just shows `ArrayBuffer(32) {}` — the console will not dump the contents for you. That is the problem Step 3 solves.

- **Official documentation:** [`SubtleCrypto.digest()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)

## Step 3 — Display the digest as hex

An `ArrayBuffer` is a lump of memory — useful to a program, unreadable to a human. The standard way to *display* bytes is **hex**: each byte becomes two hex characters. The browser has no built-in bytes-to-hex function, so you write a small helper once and reuse it everywhere. The readable version is a plain loop:

```js
function toHex(buf) {
  const bytes = new Uint8Array(buf);                    // view the ArrayBuffer as bytes
  let hex = '';                                         // build the result one byte at a time
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');          // byte -> two hex characters
  }
  return hex;
}
```

Two ideas make it work:

- `byte.toString(16)` converts a number to a base-16 (hex) string. `104..toString(16)` is `"68"`, because 104 in hex is `68`.
- `.padStart(2, '0')` pads the string to at least two characters with a leading zero. This matters:

| byte | `toString(16)` | after `padStart(2, '0')` |
|---|---|---|
| 104 | `"68"` | `"68"` |
| 10 | `"a"` | `"0a"` |
| 255 | `"ff"` | `"ff"` |

Without the padding, byte `10` would print as `"a"`, the fingerprint would come out one character short, and two identical digests could be formatted differently. Every byte must be exactly two characters, so a 32-byte digest is always a 64-character hex string.

## The known-answer check

Here is the moment that tells you your whole pipeline is correct. Hash `hello world` and format it:

```js
toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello world')));
// b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
```

`b94d27b9...cde9` is the published SHA-256 digest of `hello world`. If your output matches, then your encode → digest → hex pipeline is byte-for-byte correct — no guessing required. This is the *known-answer test*: verify your code against a value that is already trusted. You will use this exact technique on the later pages.

## The avalanche effect

Hash two strings that differ by a single character:

```js
const h1 = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello world')));
const h2 = toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hello worle')));

console.log(h1);
// b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9
console.log(h2);
// 0fc30e735a0228a31cbbb969988b4f50e02e737f979f091d7d224b765443f5d4
```

One character changed (`d` → `e`), and the two digests share no visible structure. The same applies to case: `Hello World` hashes to `a591a6d4...`, completely different from `hello world`. This is the **avalanche effect**, and it is what makes hashes reliable change-detectors: any modification, accidental or malicious, produces a different digest.

## Fingerprints

Because hashing is deterministic and one-way, a digest can serve as a **fingerprint** — a compact, unique identifier for a larger piece of data. If Alice hashes her public key and reads you a few hex characters, you can confirm you received the right key by hashing what you actually received and comparing. The digest itself is just bytes; the *hex string* is the fingerprint, because hex is what humans can read, copy, and compare side by side.

This is exactly how SSH host keys work, and it is the trust model you will build in this tutorial: on [page 4](04-asymmetric-keys.html) you will export a real public key, and on [page 6](06-putting-it-together.html) you will hash a peer's key into a fingerprint and verify it before trusting them.

## Recap

- Hashing is one-way, deterministic, and fixed-size — SHA-256 always returns **32 bytes**. It is not encryption.
- Strings become bytes with `new TextEncoder().encode(...)`; bytes, not bits.
- `await crypto.subtle.digest('SHA-256', bytes)` returns an `ArrayBuffer`.
- Hex is the *display format*, not part of the hash: 32 bytes → 64 hex characters, via a `toHex()` helper using `toString(16)` and `padStart(2, '0')`.
- Verify your pipeline with a known answer: `hello world` → `b94d27b9...cde9`.
- One changed character (or capital letter) completely changes the digest — the avalanche effect.
- A hash of a public key is a *fingerprint*: safe to share, easy to compare.

## Hands-on checkpoint

Do these in order — retype, predict, break, rebuild.

1. Retype the `toHex` helper into your console **from memory**, then re-hash `hello world` and confirm `b94d27b9...cde9`. If the helper needs fixing, retype it again — you will use it on every remaining page.
2. Hash your own first name. Before you run it, predict: how many hex characters will the digest have?
3. Change one letter in your name and hash again. Confirm the two digests share no visible pattern.
4. Hash the empty string: `await crypto.subtle.digest('SHA-256', new Uint8Array())`, then format it. Predict the length, then confirm it starts with `e3b0c442`. Matching that published value proves your entire pipeline again, end to end.
5. Explain to someone (or out loud) why a public key's fingerprint can safely be displayed in a chat app, but the key itself cannot be treated that casually.

← [Prev: Getting Started](01-getting-started.html) · [Next: Symmetric Encryption with AES-GCM →](03-symmetric-encryption.html)
