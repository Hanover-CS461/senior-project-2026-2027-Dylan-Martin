---
layout: default
---

# 3 — Symmetric Encryption with AES-GCM

← [Prev: Hashing with SHA-256](02-hashing.html) · [Next: Asymmetric Keys with ECDH →](04-asymmetric-keys.html)

On page 2 you learned to *digest* data — but a hash is one-way; nobody can ever read it back. This page is where data actually becomes a secret you can share: **symmetric encryption** with AES-GCM, where one key both locks and unlocks a message. This is the same algorithm family the FRUM project uses to encrypt every chat message, and by the end of this page you will have encrypted, decrypted, and *broken* a message on purpose — which is the only way to really understand encryption.

**In this page you will learn to:**

- Generate a 256-bit AES key with `crypto.subtle.generateKey()`
- Encrypt and decrypt data with AES-GCM
- Use a fresh random IV for every message — and why reusing one can be a disaster 
- Explain why ciphertext is always 16 bytes longer than the plaintext
- Detect tampered ciphertext, and do it on purpose

## Symmetric encryption in one paragraph

Symmetric encryption uses **one key** for both operations: the same key encrypts and decrypts. (You will meet asymmetric, two-key crypto on page 4.) The algorithm here is **AES-GCM** — the Advanced Encryption Standard in *Galois/Counter Mode*. The mode matters: GCM is an **authenticated encryption** scheme, meaning it guarantees both *confidentiality* (nobody can read your message) and *integrity* (nobody can change it without you noticing).

## The algorithm descriptor

Every `crypto.subtle` call takes an **algorithm descriptor** — a plain object that describes what you want to do:

```js
{ name: 'AES-GCM', length: 256 }
```

Note the syntax: it is an object, so it is `length: 256` with a colon, not `length = 256`. Getting comfortable with these descriptors is the key to the whole API — every page from here on leads with one.

- **Official documentation:** [Web Crypto algorithm descriptors — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto#supported_algorithms)

## Generate the key

`generateKey()` takes three arguments: the algorithm descriptor, an `extractable` flag, and a list of allowed uses:

```js
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },  // algorithm descriptor
  false,                             // extractable: can the key ever leave the browser?
  ['encrypt', 'decrypt']             // what the key is allowed to do
);
console.log(key);
// CryptoKey { type: "secret", extractable: false, algorithm: {...}, usages: ["encrypt", "decrypt"] }
```

The result is a **`CryptoKey`** object — an opaque handle. You never see the key material itself, and the browser won't let you. Two arguments deserve attention:

- **`extractable: false`** means the key can never be exported from the browser. That is the secure choice. (Page 4 goes deep on when you *do* want export.)
- **`usages`** is checked against the algorithm: an AES key accepts `encrypt`, `decrypt`, `wrapKey`, and `unwrapKey` — not `sign` or `verify`, which belong to asymmetric keys. Ask for a usage the algorithm does not support and `generateKey()` throws.

- **Official documentation:** [`SubtleCrypto.generateKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey)

## Prepare the IV

AES-GCM requires an **initialization vector (IV)** — a non-secret value mixed into the encryption so that the *same message encrypted twice produces different ciphertext*. The IV is not secret; it is sent alongside the ciphertext. What matters is that it is **random and never reused with the same key**.

```js
const iv = crypto.getRandomValues(new Uint8Array(12));
console.log(iv);
// Uint8Array(12) [47, 183, 205, 19, 8, 121, 90, 141, 244, 36, 71, 13]
```

Two habits to build now:

- **12 bytes**, not 16. GCM's standard nonce length is 96 bits (12 bytes), per NIST SP 800-38D. Browsers accept other lengths, but 12 is the recommendation.
- **Always `crypto.getRandomValues()`.** A tempting shortcut is `new Uint8Array(12)`, which looks identical — but it is an array of *zeros*. A predictable IV decrypts fine, which is exactly the trap: it *works* while being broken.

**Never reuse an (IV, key) pair.** If two messages are encrypted with the same key and the same IV, GCM's keystream repeats, and an attacker who sees both ciphertexts can recover plaintext. Real products have shipped this bug. A fresh random IV per message makes accidental reuse astronomically unlikely.

- **Official documentation:** [`Crypto.getRandomValues()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) · [AES-GCM (NIST SP 800-38D) — Wikipedia](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

## Encrypt

`encrypt()` takes the descriptor *with the IV inside it*, the key, and the data — three arguments:

```js
const encoder = new TextEncoder();
const text = 'UPDATE';
const encoded = encoder.encode(text);              // page 2 pipeline: string -> bytes

const cipher = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: iv },                     // the IV rides inside the descriptor
  key,
  encoded
);

console.log(cipher.byteLength);
// 22   (6 bytes of plaintext + 16 bytes of authentication tag)
```

`encoded` is 6 bytes (`UPDATE`), but `cipher` is **22** — the plaintext plus a 16-byte **authentication tag**. That tag is GCM's integrity guarantee, and it is exactly why the ciphertext is longer than the plaintext. Every byte of the tag is computed from the key, the IV, and the message; if any of them changes, the tag no longer matches.

Do not try to read the ciphertext as text — it is random-looking binary, and decoding it produces garbage on purpose:

```js
console.log(new TextDecoder().decode(cipher));
// �˿y"�"&M��
```

That garbage is the point: the secret is secret.

- **Official documentation:** [`SubtleCrypto.encrypt()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) · [`TextDecoder` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder)

## Decrypt

Decryption is the mirror image — same three arguments, same IV, same key:

```js
const plain = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: iv },
  key,
  cipher
);

console.log(new TextDecoder().decode(plain));
// UPDATE
```

The IV and key must match exactly — that is not a flaw, it is the security model: only someone with the key (and the IV sent alongside the message) can read it. TextEncoder turned text into bytes; TextDecoder turns the decrypted bytes back into text.

- **Official documentation:** [`SubtleCrypto.decrypt()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt)

## Tamper with the ciphertext

Here is the part that makes authenticated encryption different from plain encryption. Try to decrypt a *modified* ciphertext:

```js
const tampered = new Uint8Array(cipher.slice(0));   // copy the bytes so we don't touch `cipher`
tampered[0] ^= 0xff;                                // flip every bit of the first byte

try {
  const result = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    tampered
  );
  console.log(new TextDecoder().decode(result));    // never reached
} catch (err) {
  console.log(err.name);
  // OperationError
}
```

One flipped byte, and decryption **throws `OperationError`** instead of returning garbage. The tag did its job: GCM recomputed the tag over the modified ciphertext, it did not match, and the browser refused to hand you untrusted plaintext. *This* is the difference between "no one can read it" and "no one can read it, and no one can change it without you knowing."

A note on the code: `cipher` is an `ArrayBuffer`, which you cannot modify directly — `cipher += 0x0a` does not append a byte, it coerces the buffer to a string and tacks the text `"10"` onto it. To touch bytes, wrap the buffer in a **`Uint8Array` view** and modify through it, exactly as above.

## Prove the IV works

Encrypt the same message twice with fresh IVs, and compare:

```js
const c1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) }, key, encoded);
const c2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) }, key, encoded);

console.log(toHex(c1));
console.log(toHex(c2));
// two completely different hex strings, even though the plaintext is identical
```

Same key, same plaintext, different ciphertext — the IV is doing its job. This is why you could never verify this page against a published "known answer" like page 2: the ciphertext is random by design. Your known-answer check here is the round-trip: encrypt, decrypt, and get *your* message back, byte for byte.

## Recap

- Symmetric encryption: **one key** encrypts and decrypts. AES-GCM adds **authenticated** encryption — integrity as well as secrecy.
- `generateKey({ name: 'AES-GCM', length: 256 }, extractable, usages)` returns a `CryptoKey` handle; `extractable: false` is the secure default.
- The **IV** goes inside the algorithm descriptor: `{ name: 'AES-GCM', iv: iv }`. Use `crypto.getRandomValues(new Uint8Array(12))` — 12 bytes, random, never reused.
- Ciphertext is plaintext **+ 16 bytes**: the authentication tag, the source of tamper detection.
- Tampered ciphertext → decrypt **throws `OperationError`**. Never trust plaintext the browser refused to authenticate.
- `ArrayBuffer` is not mutable; use a `Uint8Array` view to read or modify bytes.

## Hands-on checkpoint

Do these in order — retype, predict, break, rebuild.

1. Retype the round-trip from memory: generate key, encrypt `UPDATE`, decrypt, confirm the message comes back. No peeking.
2. Predict before running: encrypt your name, then `console.log(cipher.byteLength)` — how many bytes longer than the plaintext?
3. Encrypt the same message twice with fresh IVs. Predict the outcome, then confirm the two hex strings differ.
4. Tamper with the *last* byte of the ciphertext instead of the first. Same error? Now explain why the position does not matter.
5. Explain to someone (or out loud) why `new Uint8Array(12)` is dangerous even though it decrypts correctly.

← [Prev: Hashing with SHA-256](02-hashing.html) · [Next: Asymmetric Keys with ECDH →](04-asymmetric-keys.html)
