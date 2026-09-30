---
layout: default
---

# 5 — Deriving a Shared Secret

← [Prev: Asymmetric Keys with ECDH](04-asymmetric-keys.html) · [Next: Putting It Together →](06-putting-it-together.html)

Page 4 gave every user a key pair — but a pair alone does nothing. The entire point of ECDH is what *two* pairs can compute together: a secret that both sides arrive at independently and that nobody else can. This page delivers the payoff page 4 promised. You will derive the raw shared secret, learn why that secret is *not* a key (the NIST SP 800-56A footgun), turn it into a proper AES-GCM key with **HKDF**, and prove both endpoints got the same key by encrypting with one and decrypting with the other — the exact flow at the heart of end-to-end-encrypted chat.

**In this page you will learn to:**

- Compute the raw shared secret with `crypto.subtle.deriveBits()`
- Explain why raw ECDH output must never be used directly as a key
- Turn the shared secret into a real AES key with HKDF: `importKey` + `deriveKey`
- Use `salt` and `info` correctly — shared, not secret
- Prove two independent derivations produced the same key

## Two pairs, one secret

Alice and Bob each have a P-256 key pair from [page 4](04-asymmetric-keys.html). They exchange only public keys. Now each side runs `deriveBits()` — their *own private key* combined with the *other person's public key*:

```js
const aliceShared = await crypto.subtle.deriveBits(
  { name: 'ECDH', public: bobPair.publicKey },  // the other person's public key
  alicePair.privateKey,                          // your private key
  256                                            // length in bits: 256 bits = 32 bytes
);

const bobShared = await crypto.subtle.deriveBits(
  { name: 'ECDH', public: alicePair.publicKey },
  bobPair.privateKey,
  256
);
```

The result is an `ArrayBuffer` of **32 bytes** — the shared secret. Format both with `toHex` from [page 2](02-hashing.html):

```js
console.log(toHex(aliceShared));
console.log(toHex(bobShared));
// both print the same 64-character hex string
```

Two independent computations, in two different browsers, produced identical bytes — and neither secret was ever sent anywhere. That is the Diffie-Hellman property from page 4, now observed directly. An eavesdropper holding both *public* keys and watching every message still cannot compute these bytes, because the one input they lack — a private key — is the one that matters.

Note the algorithm descriptor: for deriving, it is just `{ name: 'ECDH', public: ... }`.

- **Official documentation:** [`SubtleCrypto.deriveBits()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits)

## The footgun: raw output is not a key

Those 32 bytes are a *shared secret* — **not** a key. There are two reasons, one mechanical and one cryptographic:

- **Mechanical:** `deriveKey()` requires a `CryptoKey` object as its base key. Raw bytes from `deriveBits` are just an `ArrayBuffer`; you cannot feed them to `deriveKey` directly.
- **Cryptographic (the real one):** NIST SP 800-56A, the standard for pair-wise key establishment, is explicit: the raw ECDH output must be run through a **key derivation function (KDF)** before use. Why? *Domain separation.* If you used the raw secret directly as your AES key, you could never safely derive *other* keys from the same secret — a MAC key, a next-session key — because they would all be the same bytes, and one compromise or reuse would leak into everything. A KDF takes one secret and produces *independent* keys per purpose and per session.

**The trap is that the wrong way works.** You can call `deriveKey({ name: 'ECDH', public }, privateKey, { name: 'AES-GCM', length: 256 }, ...)` and both sides will match — Web Crypto's ECDH derivation applies **no KDF at all** (its derive params are only `{ name, public }`). The tutorial pattern many examples show is exactly this footgun wearing a disguise: it works, both sides agree, and the secret is silently being used raw. The correct path is what the rest of this page does: shared secret → HKDF → AES key.

- **Official documentation:** [NIST SP 800-56A Rev. 3 — pair-wise key establishment](https://csrc.nist.gov/pubs/sp/800/56/a/r3/final)

## Import the secret as HKDF material

**HKDF** is the key derivation function Web Crypto provides for exactly this job — MDN describes it as designed for "high-entropy input, such as the output of an ECDH key agreement operation" (RFC 5869). The first step is to wrap the raw bytes in a `CryptoKey` so `deriveKey` will accept them:

```js
const aliceHKDF = await crypto.subtle.importKey(
  'raw',            // format: HKDF only accepts raw bytes
  aliceShared,      // the 32 shared bytes
  'HKDF',           // what the key material will be used for
  false,            // extractable: never
  ['deriveKey']     // its only job is to derive
);
```

Repeat for Bob with `bobShared`. Note how different this `importKey` is from page 4: no JWK, no curve, no `kty` — raw bytes in, derivation-only handle out. The usages matter: this key exists *only* to be fed into `deriveKey`, so `['deriveKey']` is its entire permission set.

- **Official documentation:** [`SubtleCrypto.importKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey) · [HKDF (RFC 5869)](https://www.rfc-editor.org/rfc/rfc5869)

## The HKDF parameters: hash, salt, info

Before the derivation call, build the three HKDF parameters:

```js
const salt = crypto.getRandomValues(new Uint8Array(32));          // shared, NOT secret
const info = new TextEncoder().encode('FRUM conversation key');   // purpose of this key
```

- **`hash`** — the hash HKDF builds on: `'SHA-256'`.
- **`salt`** — a non-secret random value that makes the derived key unique even when two sessions share the same ECDH secret. It is a *shared parameter*: **both endpoints must use the same salt**, or they derive different keys and the round-trip fails. It does not need to be secret — an attacker who knows the salt still cannot derive anything without the shared secret. In a real application, the salt travels alongside the ciphertext (like the IV from page 3) or is fixed by the protocol; a fresh random salt per session is good practice.
- **`info`** — a purpose string. It gives the derived key a name, so the same secret cannot silently become both an encryption key and something else. Also shared, also not secret.

Both `salt` and `info` are *domain separation*: they guarantee that identical ECDH secrets produce different keys in different contexts.

## Derive the AES key

Now the five-parameter `deriveKey()` — the parameters look like a lot, but each one answers one question:

```js
const aliceSymKey = await crypto.subtle.deriveKey(
  { name: 'HKDF', hash: 'SHA-256', salt, info },  // 1. the derivation algorithm + its params
  aliceHKDF,                                       // 2. the base key (the imported secret)
  { name: 'AES-GCM', length: 256 },                // 3. what to return: a 256-bit AES key
  false,                                           // 4. extractable: never
  ['encrypt', 'decrypt']                           // 5. usages: exactly what AES-GCM needs
);

const bobSymKey = await crypto.subtle.deriveKey(
  { name: 'HKDF', hash: 'SHA-256', salt, info },
  bobHKDF,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

Alice's and Bob's derived keys are `CryptoKey` objects — opaque, non-extractable, and (if all the shared parameters matched) **identical**. These are the keys the endpoints will feed to AES-GCM, exactly like page 3's keys.

- **Official documentation:** [`SubtleCrypto.deriveKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey)

## The proof: Bob encrypts, Alice decrypts

Exporting the keys to compare them would defeat their purpose (they are non-extractable). The stronger proof is functional: Bob encrypts with *his* derived key, Alice decrypts with *hers*, and the message comes back intact. If the derivation had gone wrong on either side, this would fail.

```js
const iv = crypto.getRandomValues(new Uint8Array(12));           // page 3 rules: fresh IV

const message = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  bobSymKey,                                                     // Bob encrypts with HIS key
  new TextEncoder().encode('Hello Bob')
);

// message + iv travel to Alice. The iv is not secret — it rides along.

const plain = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  aliceSymKey,                                                   // Alice decrypts with HERS
  message
);

console.log(new TextDecoder().decode(plain));
// Hello Bob
```

Two separate derivations, two separate browsers, one working round-trip — the keys are byte-for-byte the same, and the IV + salt were the only things that had to travel with the ciphertext. This is the complete cryptographic core of an end-to-end-encrypted chat: key agreement in the browser, secret derived on both ends, server relays ciphertext it cannot read.

## Recap

- `deriveBits({ name: 'ECDH', public }, privateKey, 256)` → the **raw shared secret**, 32 bytes, identical on both sides.
- **The footgun:** raw ECDH output is never a key. Mechanically, `deriveKey` needs a `CryptoKey`; cryptographically, NIST SP 800-56A requires a KDF for *domain separation*. The naive ECDH→AES `deriveKey` skips the KDF — it works, and that is why it is dangerous.
- The proper path: `importKey('raw', secret, 'HKDF', false, ['deriveKey'])`, then `deriveKey` with HKDF.
- HKDF parameters: `hash: 'SHA-256'`, plus `salt` and `info` — **shared, not secret**, identical on both sides, fresh salt per session.
- Proof of correctness: encrypt with one derived key, decrypt with the other.

## Hands-on checkpoint

Do these in order — retype, predict, break, rebuild.

1. Retype the whole flow from memory: two pairs → `deriveBits` on both sides → hex-compare → `importKey` → `deriveKey` → round-trip. No peeking; use the error messages to fix yourself.
2. Predict, then do: change the `salt` on Bob's side only (derive Bob's key with a different salt) and try the round-trip. What error do you get, and why?
3. Explain to someone why "it works, both sides match" is not the same as "it is correct" — use the naive ECDH→AES shortcut as your example.
4. Answer out loud: the salt and `info` are sent in plaintext alongside the ciphertext. Why does that not help an attacker?
5. Predict the result of using a 128-bit length in `deriveBits` (e.g., `128`). Try it — what changed about the shared secret?

← [Prev: Asymmetric Keys with ECDH](04-asymmetric-keys.html) · [Next: Putting It Together →](06-putting-it-together.html)
