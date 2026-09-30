---
layout: default
---

# 4 — Asymmetric Keys with ECDH

← [Prev: Symmetric Encryption with AES-GCM](03-symmetric-encryption.html) · [Next: Deriving a Shared Secret →](05-key-agreement.html)

Page 3 used **one key** for both encrypting and decrypting — but that only works when both sides already share the key, which raises the question: how do two people who have never met agree on a secret without sending it in plaintext? That is what **asymmetric cryptography** is for. Instead of one key, each person gets a **key pair**: a *public* key meant to be shared with everyone, and a *private* key that never leaves the device. This page is where you generate your first key pair, share the public half as a portable **JWK**, import a peer's public key, and learn why the private half stays locked in the browser.

**In this page you will learn to:**

- Generate an ECDH key pair on the P-256 curve
- Read a JSON Web Key (JWK) and explain each field
- Export a public key as JWK — the only thing you would ever upload to a server
- Import a peer's public key from JWK
- Explain why the private key never leaves the device, and what the `extractable` flag actually governs

## From one key to a key pair

`generateKey()` works differently here than on page 3. For AES-GCM it returned a single `CryptoKey`; for **ECDH** — Elliptic Curve Diffie-Hellman, the key-agreement algorithm — it returns a **`CryptoKeyPair`**: two keys in one object.

```js
const keyPair = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },   // P-256: a NIST-standard elliptic curve
  false,                                    // extractable: can the key ever leave the browser?
  ['deriveKey', 'deriveBits']               // what the key is allowed to do
);

console.log(keyPair);
// CryptoKeyPair {
//   publicKey:  CryptoKey { type: "public",  extractable: true,  algorithm: {...}, usages: [] },
//   privateKey: CryptoKey { type: "private", extractable: false, algorithm: {...}, usages: ["deriveKey", "deriveBits"] }
// }
```

Two things to notice, because both differ from page 3:

- **`namedCurve: 'P-256'`** — ECDH doesn't take a key length; it takes a *curve*. P-256 is the NIST-standard elliptic curve used throughout the Web Crypto API and is the same curve the FRUM project uses.
- **Usages are `deriveKey`/`deriveBits`, not `encrypt`/`decrypt`.** An ECDH key never encrypts anything directly. Its entire job is to *derive* a shared secret — which is page 5's entire topic. Ask for `encrypt` here and `generateKey()` throws.

- **Official documentation:** [`SubtleCrypto.generateKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey) · [ECDH — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#ecdh)

### What `extractable` actually governs

You passed `extractable: false`, but look at the pair above: the **public** key is still `extractable: true`. The flag governs the **private** key. Public keys are *public by definition*; if they could not be exported, you could never share them. The flag exists to answer one question about the private key: *can any script on this page ever pull it out of the browser?* Setting it to `false` means no — not even your own code can, without regenerating the pair. That is the secure default, and it is the setting real applications use.

## JWK — the JSON Web Key format

To share a public key, it has to leave the browser — over the network, into a file, into a database. The Web Crypto API's portable format for that is **JWK (JSON Web Key)** — a standard, plain-JSON representation defined in [RFC 7517](https://www.rfc-editor.org/rfc/rfc7517). Because it is JSON, a JWK can be sent over HTTP, stored in a database, or pasted between two browser windows — which you will literally do on page 6.

An ECDH public key exported as JWK looks like this:

```js
{
  kty: "EC",            // key type: Elliptic Curve
  crv: "P-256",         // curve: which elliptic curve the key is on
  x: "VUq...",          // x coordinate of the public point (base64url)
  y: "4bq...",          // y coordinate of the public point (base64url)
  ext: true,            // extractable
  key_ops: []           // operations this key is allowed to do
}
```

Each field means something:

| Field | Meaning |
|---|---|
| `kty` | Key type — `"EC"` for elliptic-curve keys |
| `crv` | The curve used — `"P-256"` |
| `x`, `y` | The coordinates of the public point on the curve — **base64url**-encoded, not hex. Together they are the entire public key |
| `ext` | Whether the key is extractable |
| `key_ops` | The allowed operations — matches the usages list |
| `d` | *Private keys only* — the secret scalar. It appears only if you export a private key, which you should never do in a real application |

- **Official documentation:** [JSON Web Key (RFC 7517)](https://www.rfc-editor.org/rfc/rfc7517) · [JWK — Wikipedia](https://en.wikipedia.org/wiki/JSON_Web_Key)

## Export the public key

`exportKey()` takes two arguments: the format and the key to export. Use `keyPair.publicKey` — the private key stays home:

```js
const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
console.log(jwk);
// { kty: "EC", crv: "P-256", x: "...", y: "...", ext: true, key_ops: [] }
```

This JWK object is **the only thing a chat server should ever store about your key**. In the FRUM project, this is the exact step where a user uploads the public half of their pair while the private half never leaves the browser.

- **Official documentation:** [`SubtleCrypto.exportKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey)

## Import a peer's key

The other half of the flow: you receive someone else's public key as a JWK and turn it back into a `CryptoKey` you can use. `importKey()` takes **five** arguments — format, key data, algorithm, extractable, and usages:

```js
const importedKey = await crypto.subtle.importKey(
  'jwk',                                    // format: must match the key data
  jwk,                                      // key data: the JWK you exported
  { name: 'ECDH', namedCurve: 'P-256' },    // algorithm: must match the JWK's crv
  false,                                    // extractable for the imported key
  []                                        // usages
);
```

Two details are easy to trip on:

- **The algorithm must match the key.** If the JWK says `crv: "P-256"` but you import with `namedCurve: "P-521"`, the browser throws. (For ECDH, `namedCurve` is required here even though `crv` is in the JWK.)
- **The usages must be a subset of the JWK's `key_ops`.** If the JWK declares `key_ops: []` and you ask for `['deriveKey']`, the browser throws a `DataError`. The imported public key is exactly as capable as the one you exported — no more.

- **Official documentation:** [`SubtleCrypto.importKey()` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey)

## The private key stays home

Why is the private key so important that it must never be exported? Because it is the one piece that turns two public keys into a shared secret. The Diffie-Hellman flow, in plain terms:

1. Alice and Bob each generate a key pair. They keep their private keys and exchange only public keys.
2. Alice runs a function with *her private key and Bob's public key*. Bob runs the same function with *his private key and Alice's public key*.
3. Both functions return the **same** value — a shared secret neither of them ever sent over the wire.
4. An eavesdropper has Alice's public key, Bob's public key, and the values from step 2 — but without either private key, they cannot compute the shared secret.

The math is easiest to see with Diffie-Hellman over modular arithmetic (a number raised to a power, reduced modulo a prime), where the one-way operation is exponentiation. ECDH is the same protocol moved onto elliptic curves — the "function" is point multiplication instead of exponentiation, which is why the keys are smaller and faster. The property that matters is identical: **easy to compute one way, infeasible to reverse** without the private key.

Now prove the private key really is locked. Try to export it:

```js
try {
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  console.log(privateJwk);
} catch (err) {
  console.log(err.name);
  // InvalidAccessError
}
```

`InvalidAccessError` — the browser refuses, because you generated the pair with `extractable: false`. Had you used `true`, the private JWK would come back complete with the `d` field, and *any script on the page* — including a cross-site-scripting attacker — could export it and impersonate the user. That is the threat the flag exists to prevent, and why real applications keep it `false`.

## Your public key's fingerprint

You already have every tool you need to fingerprint your own key. Hash the exported JWK and format it with `toHex` from page 2:

```js
const fingerprint = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(JSON.stringify(jwk))
);
console.log(toHex(fingerprint));
// 6f1c9b2d...  (your key's fingerprint — unique to your public key)
```

This is the *same* fingerprint concept from [page 2](02-hashing.html): a compact, shareable identifier for a larger piece of data. On page 6, this is how two peers will verify they are actually talking to each other — compare fingerprints out of band, trust the key.

## Recap

- ECDH `generateKey()` returns a **`CryptoKeyPair`** — `{ publicKey, privateKey }` — on the **P-256** curve, with usages `deriveKey`/`deriveBits` (never `encrypt`/`decrypt`).
- `extractable: false` locks the **private** key; public keys are always extractable — that is the design, not a bug.
- **JWK** is the portable JSON format: `kty`, `crv`, `x`, `y` (base64url coordinates), `ext`, `key_ops`, and `d` (private only).
- `exportKey('jwk', keyPair.publicKey)` — the only key material a server should ever see.
- `importKey(format, keyData, algorithm, extractable, usages)` — five arguments; algorithm and usages must match the JWK or the browser throws.
- Exporting a non-extractable key throws **`InvalidAccessError`**.
- The DH flow: private key + peer's public key → same shared secret on both sides; eavesdroppers lack the private key, so the secret stays secret.

## Hands-on checkpoint

Do these in order — retype, predict, break, rebuild.

1. Retype the key-pair generation from memory: `generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits'])`. Then predict — *before running* — what `keyPair.publicKey.usages` and `keyPair.privateKey.usages` will be.
2. Export the public JWK and, without looking at this page, identify every field by name: which one is the curve, which two are the point coordinates, which one says the key is extractable?
3. Re-import your exported JWK, then change one thing — import it with `{ name: 'ECDH', namedCurve: 'P-521' }` instead of P-256. Read the error. Then try usages `['deriveKey']` on a JWK whose `key_ops` is `[]`. Read that error too.
4. Predict the error name before exporting the non-extractable private key. Were you right? (`InvalidAccessError`.)
5. Explain the Diffie-Hellman flow to someone (or out loud) using only: *public keys are exchanged, private keys never are, both sides compute the same value*. If they can follow it, you understand it.

← [Prev: Symmetric Encryption with AES-GCM](03-symmetric-encryption.html) · [Next: Deriving a Shared Secret →](05-key-agreement.html)
