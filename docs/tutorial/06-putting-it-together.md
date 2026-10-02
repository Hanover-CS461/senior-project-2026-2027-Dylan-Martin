---
layout: default
---

# 6 — Putting It Together

← [Prev: Deriving a Shared Secret](05-key-agreement.html) · [Next: Practice Exercises →](07-practice-exercises.html)

This is the page the whole tutorial has been building toward: two real HTML pages exchanging encrypted messages, with your browser as both sender and receiver. Everything you did in the console — the key pairs from [page 4](04-asymmetric-keys.html), the ECDH → HKDF → AES-GCM derivation from [page 5](05-key-agreement.html), the AES-GCM round-trips from [page 3](03-symmetric-encryption.html) — gets wired into button handlers on real pages. Nothing new cryptographically happens here; what is new is *plumbing*: reading input fields, writing results into `<pre>` elements, and keeping one piece of state alive across button clicks.

**In this page you will learn to:**

- Wire the page-4 and page-5 API calls into a page with buttons and state
- Exchange public keys between two browser windows
- Verify a peer's key with a SHA-256 fingerprint before trusting it
- Serialize ciphertext and IV as JSON — the message format a real chat server would relay
- Run a complete two-party encrypted exchange and watch every step work

## What you're building

The two pages are identical except for one word in the heading. Each one:

1. Generates an ECDH key pair on load and shows the public key as JWK in a `<pre>` at the top.
2. Lets you paste the other page's public key and derive the shared secret — the entire page-5 flow in one button click.
3. Lets you type a message and encrypt it with the derived AES-GCM key, outputting IV + ciphertext as JSON.
4. Lets you paste that JSON back and decrypt it to plaintext.

```
Alice's window                      Bob's window
──────────────────────              ──────────────────────
 1. public key (JWK) ─────────────▶  2. paste → Import
 3. paste ←───────────────────────   1. public key (JWK)
 4. Encrypt → {iv, ciphertext} ───▶  5. paste → Decrypt
```

The arrows are your hands. Everything that travels — public keys, IVs, ciphertext — is public by design. The one thing that must never travel, the derived AES key, never leaves either page.

## From console to buttons

The script section of each page is the page-5 flow reorganized into three layers. Compare it with what you typed in the console:

**The helpers.** Every crypto call is wrapped in a one-line function. `generateKeyPair()`, `exportPublicKey()`, `importPublicKey()`, `deriveSecret()`, `importHKDF()`, and `deriveSymKey()` are the exact calls from pages 4–5; `encryptMessage()` and `decryptMessage()` are page 3's `encrypt`/`decrypt`; `toHex()` is page 2's helper.

**The state.** `main()` holds the page's working memory in two variables: `aliceKeyPair` and `symmetricKey`, which starts as `null`. The button handlers are closures over these variables: they read from them, update them, and never touch globals.

**The wiring.** Every button gets an `addEventListener('click', async () => {...})`. The pattern is the same four times: read the input's `.value`, `await` the crypto call, write the result into a `<pre>` via `.textContent`. The `async` matters — every `crypto.subtle` call returns a Promise, exactly as on page 1, and the handler has to wait for it.

The one piece of logic worth reading carefully is the import handler:

```js
const importedPublicKey = await importPublicKey(JSON.parse(importInput.value));
const sharedSecret = await deriveSecret(aliceKeyPair.privateKey, importedPublicKey);
const HKDFKey = await importHKDF(sharedSecret);
symmetricKey = await deriveSymKey(salt, HKDFKey);
importOutput.textContent = "Import done";
```

Four lines, four `await`s: JWK → `CryptoKey`, `deriveBits`, HKDF import, HKDF `deriveKey`. Until this runs, `symmetricKey` is `null` and the encrypt/decrypt buttons have nothing to work with. "Import done" is the success signal — it only appears if all four steps resolved. That ordering, *derive first, use later*, is the entire point of the page.

- **Official documentation:** [`SubtleCrypto` — MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) (every call on this page lives here; pages 3–5 link each one individually)

## Two shared parameters, hardcoded

The two pages must derive the *same* AES key, and page 5 named the two knobs that control that: `salt` and `info`. Both files hardcode them, so they cannot disagree:

```js
const salt = new Uint8Array(32);                      // 32 zero bytes
info: new TextEncoder().encode("derived key")         // inside deriveSymKey
```

An all-zero salt is a deliberate demo simplification. Page 5 said the salt is *shared and not secret* — it can travel in plaintext or, as here, simply be baked into both pages. If one page used a random salt and the other a fixed one, the derivations would diverge and every decrypt would fail. A real application follows page 5's advice instead: a fresh random salt per session, sent alongside the ciphertext like the IV (or fixed by the protocol). This demo skips the transmission because copy-paste is already the protocol. `info` is the same idea with a name: a purpose string. Hardcoded here, it means every key derived on this page is named `derived key`; a real app would use a descriptive per-protocol string.

## The wire format

When you click **Encrypt**, the page prints one JSON object:

```json
{
  "iv": [173, 250, 11, 219, 44, 1, 90, 202, 8, 128, 33, 77],
  "encryptedMessage": [94, 217, 12, 8, 200, 141, 245, 60, 3, 189, 122, 166, 10, 79, 61, 231, 55, 42, 16, 9, 120]
}
```

Two fields and only two: the 12-byte IV (page 3: fresh per message, safe to send in the clear) and the ciphertext. Both are plain arrays of byte values — `Array.from()` converts the typed arrays the API returns into arrays that `JSON.stringify` can serialize. The numbers in `encryptedMessage` are meaningless to look at, but their *count* is not: it is the plaintext length plus 16. Encrypt `Hello` (5 bytes) and you get 21 numbers — the 16-byte GCM authentication tag is part of the ciphertext, exactly as page 3 taught.

This JSON *is* the message format. In FRUM it would be one JSON payload sent over a WebSocket; here you copy it between windows. Nothing about the payload reveals the plaintext or the keys — that is the point of everything before this page.

## alice.html

Create a folder for the pages and save this as `alice.html` inside it.

```html
<!DOCTYPE html>
<html lang='en'>
<head>
	<link rel="stylesheet" href="style.css">
	<title>Hash Playground</title>
</head>
<body>
	<h1>ALICE</h1>
	<h3>Copy whole thing and share with Bob</h3>
	<pre id="publicKey"></pre>
	<pre id="hashOutput">Verification</pre>
	<input type="text" id="hashMessage" placeholder="Type something">
	<button id="hashButton">Hash it</button>
	<pre id="importOutput">Import Key</pre>
	<input type="text" id="importMessage" placeholder="Paste shared public key">
	<button id="importButton">Import Key</button>
	<pre id="encryptOutput">Encryption</pre>
	<input type="text" id="encryptMessage" placeholder="Message to encrypt">
	<button id="encryptButton">Encrypt</button>
	<pre id="decryptOutput">Decrypt</pre>
	<input type="text" id="decryptMessage" placeholder="Message to decrypt">
	<button id="decryptButton">Decrypt</button>
    
	
	<script>
		async function generateKeyPair() {
			return await crypto.subtle.generateKey(
				{
					name: "ECDH",
					namedCurve: "P-256"
				},
				false,
				["deriveKey", "deriveBits"]);
		}
		async function exportPublicKey(keyPair) {
			return await crypto.subtle.exportKey(
				"jwk",
				keyPair.publicKey);
		}

		function toHex(buf) {
			const bytes = new Uint8Array(buf);
			let hex = '';
			for (const byte of bytes) {
				hex += byte.toString(16).padStart(2, '0');
			}
			return hex;
		} 

		async function importPublicKey(key) {
			return await crypto.subtle.importKey(
				"jwk",
				key,
				{
					name: "ECDH",
					namedCurve: "P-256"
				},
				false,
				[]);
		}

		async function deriveSecret(privateKey, publicKey) {
			return await crypto.subtle.deriveBits(
				{
					name: "ECDH",
					public: publicKey
				},
				privateKey,
				256);
		}
		
		async function importHKDF(secret) {
			return await crypto.subtle.importKey(
				"raw",
				secret,
				"HKDF",
				false,
				["deriveKey"]);
		}

		async function deriveSymKey(salt, HKDF) {
			return await crypto.subtle.deriveKey(
				{
					name: "HKDF",
					hash: "SHA-256",
					salt: salt,
					info: new TextEncoder().encode("derived key")
				},
				HKDF,
				{
					name: "AES-GCM",
					length: 256
				},
				false,
				['encrypt', 'decrypt']);
		}

        async function encryptMessage(key, iv, messageBytes) {
            return await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                messageBytes);
        }

        async function decryptMessage(key, iv, data) {
            return await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                data);
        }

		async function main() {
            const encoder = new TextEncoder();
            let symmetricKey = null;
            const salt = new Uint8Array(32);

			const aliceKeyPair = await generateKeyPair();
			const alicePublicKey = await exportPublicKey(aliceKeyPair);
			document.getElementById("publicKey").textContent = JSON.stringify(alicePublicKey);



			const hashButton = document.getElementById("hashButton");
			const hashInput = document.getElementById("hashMessage");
			const hashOutput = document.getElementById("hashOutput");

			hashButton.addEventListener('click', async () => {
				const bytes = new TextEncoder().encode(hashInput.value);
				const digest = await crypto.subtle.digest("SHA-256", bytes);
				hashOutput.textContent = toHex(digest);
			});



			const importButton = document.getElementById("importButton");
			const importInput = document.getElementById("importMessage");
			const importOutput = document.getElementById("importOutput");

			importButton.addEventListener('click', async() => {
				const importedPublicKey = await importPublicKey(JSON.parse(importInput.value));
				const sharedSecret = await deriveSecret(aliceKeyPair.privateKey, importedPublicKey);
				const HKDFKey = await importHKDF(sharedSecret);
				symmetricKey = await deriveSymKey(salt, HKDFKey);
                importOutput.textContent = "Import done";
			});

			const encryptButton = document.getElementById("encryptButton");
			const encryptInput = document.getElementById("encryptMessage");
			const encryptOutput = document.getElementById("encryptOutput");

            encryptButton.addEventListener('click', async() => {
                const message = encryptInput.value;
                const messageBytes = encoder.encode(message);
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encryptedMessage = await encryptMessage(symmetricKey, iv, messageBytes);
                const encryptedMessageBytes = toHex(encryptedMessage);
                encryptOutput.textContent = JSON.stringify({
                iv: Array.from(iv),
                encryptedMessage: Array.from(new Uint8Array(encryptedMessage))
                });
		    });


			const decryptButton = document.getElementById("decryptButton");
			const decryptInput = document.getElementById("decryptMessage");
			const decryptOutput = document.getElementById("decryptOutput");

            decryptButton.addEventListener('click', async() => {
                const information = JSON.parse(decryptInput.value);
                const iv = new Uint8Array(information.iv);
                const encryptedMessage = new Uint8Array(information.encryptedMessage);
                const decryptedMessage = await decryptMessage(symmetricKey, iv, encryptedMessage);
                const plainText = new TextDecoder().decode(decryptedMessage);
                decryptOutput.textContent = plainText;
            });

        }
		main();
	</script>
</body>
</html>
```

## bob.html

`bob.html` is the same file with one difference: the `<h1>` says BOB. Everything else is basically identical.

```html
<!DOCTYPE html>
<html lang='en'>
<head>
	<link rel="stylesheet" href="style.css">
	<title>Hash Playground</title>
</head>
<body>
	<h1>BOB</h1>
	<h3>Copy whole thing and share with Alice</h3>
	<pre id="publicKey"></pre>
	<pre id="hashOutput">Verification</pre>
	<input type="text" id="hashMessage" placeholder="Type something">
	<button id="hashButton">Hash it</button>
	<pre id="importOutput">Import Key</pre>
	<input type="text" id="importMessage" placeholder="Paste shared public key">
	<button id="importButton">Import Key</button>
	<pre id="encryptOutput">Encryption</pre>
	<input type="text" id="encryptMessage" placeholder="Message to encrypt">
	<button id="encryptButton">Encrypt</button>
	<pre id="decryptOutput">Decrypt</pre>
	<input type="text" id="decryptMessage" placeholder="Message to decrypt">
	<button id="decryptButton">Decrypt</button>
    
	
	<script>
		async function generateKeyPair() {
			return await crypto.subtle.generateKey(
				{
					name: "ECDH",
					namedCurve: "P-256"
				},
				false,
				["deriveKey", "deriveBits"]);
		}
		async function exportPublicKey(keyPair) {
			return await crypto.subtle.exportKey(
				"jwk",
				keyPair.publicKey);
		}

		function toHex(buf) {
			const bytes = new Uint8Array(buf);
			let hex = '';
			for (const byte of bytes) {
				hex += byte.toString(16).padStart(2, '0');
			}
			return hex;
		} 

		async function importPublicKey(key) {
			return await crypto.subtle.importKey(
				"jwk",
				key,
				{
					name: "ECDH",
					namedCurve: "P-256"
				},
				false,
				[]);
		}

		async function deriveSecret(privateKey, publicKey) {
			return await crypto.subtle.deriveBits(
				{
					name: "ECDH",
					public: publicKey
				},
				privateKey,
				256);
		}
		
		async function importHKDF(secret) {
			return await crypto.subtle.importKey(
				"raw",
				secret,
				"HKDF",
				false,
				["deriveKey"]);
		}

		async function deriveSymKey(salt, HKDF) {
			return await crypto.subtle.deriveKey(
				{
					name: "HKDF",
					hash: "SHA-256",
					salt: salt,
					info: new TextEncoder().encode("derived key")
				},
				HKDF,
				{
					name: "AES-GCM",
					length: 256
				},
				false,
				['encrypt', 'decrypt']);
		}

        async function encryptMessage(key, iv, messageBytes) {
            return await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                messageBytes);
        }

        async function decryptMessage(key, iv, data) {
            return await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                data);
        }

		async function main() {
            const encoder = new TextEncoder();
            let symmetricKey = null;
            const salt = new Uint8Array(32);

			const bobKeyPair = await generateKeyPair();
			const bobPublicKey = await exportPublicKey(bobKeyPair);
			document.getElementById("publicKey").textContent = JSON.stringify(bobPublicKey);



			const hashButton = document.getElementById("hashButton");
			const hashInput = document.getElementById("hashMessage");
			const hashOutput = document.getElementById("hashOutput");

			hashButton.addEventListener('click', async () => {
				const bytes = new TextEncoder().encode(hashInput.value);
				const digest = await crypto.subtle.digest("SHA-256", bytes);
				hashOutput.textContent = toHex(digest);
			});



			const importButton = document.getElementById("importButton");
			const importInput = document.getElementById("importMessage");
			const importOutput = document.getElementById("importOutput");

			importButton.addEventListener('click', async() => {
				const importedPublicKey = await importPublicKey(JSON.parse(importInput.value));
				const sharedSecret = await deriveSecret(bobKeyPair.privateKey, importedPublicKey);
				const HKDFKey = await importHKDF(sharedSecret);
				symmetricKey = await deriveSymKey(salt, HKDFKey);
                importOutput.textContent = "Import done";
			});

			const encryptButton = document.getElementById("encryptButton");
			const encryptInput = document.getElementById("encryptMessage");
			const encryptOutput = document.getElementById("encryptOutput");

            encryptButton.addEventListener('click', async() => {
                const message = encryptInput.value;
                const messageBytes = encoder.encode(message);
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encryptedMessage = await encryptMessage(symmetricKey, iv, messageBytes);
                const encryptedMessageBytes = toHex(encryptedMessage);
                encryptOutput.textContent = JSON.stringify({
                iv: Array.from(iv),
                encryptedMessage: Array.from(new Uint8Array(encryptedMessage))
                });
		    });


			const decryptButton = document.getElementById("decryptButton");
			const decryptInput = document.getElementById("decryptMessage");
			const decryptOutput = document.getElementById("decryptOutput");

            decryptButton.addEventListener('click', async() => {
                const information = JSON.parse(decryptInput.value);
                const iv = new Uint8Array(information.iv);
                const encryptedMessage = new Uint8Array(information.encryptedMessage);
                const decryptedMessage = await decryptMessage(symmetricKey, iv, encryptedMessage);
                const plainText = new TextDecoder().decode(decryptedMessage);
                decryptOutput.textContent = plainText;
            });

        }
		main();
	</script>
</body>
</html>
```

## style.css — the optional dark theme

Both pages link a `style.css`, but the stylesheet is optional. You will see a harmless 404 for the stylesheet in the network tab. This is my personal style.css file. It is the same stylesheet as FRUM website just without the jekyll import.

```css
body {
  background-color: #090909;
  padding: 0;
  font-family: "Courier New", monospace;
  font-size: 15px;
  color: #f3c99f;
  line-height: 1.2;
}

.wrapper {
  width: 850px;
  margin: 40px auto 0;
  background: #2c211c;
  border: 2px solid #d27742;

  display: flex;
  flex-wrap: wrap;
}

header {
  width: 100%;
  float: none;
  position: static;

  padding: 35px 50px;
  box-sizing: border-box;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  text-align: left;
}

section {
  width: 100%;
  float: none;
  clear: both;
  position: static;

  padding: 35px 30px 60px;
  box-sizing: border-box;
}

section li strong {
  text-align: left;
  margin: 0;
  color: #FFAD6C;
  font-weight: none;
}

section p strong {
  text-align: left;
  margin: 0;
  color: #FFAD6C;
  font-weight: none;
}

section code {
  color: #857D7A;
}

a {
  color: #d87534;
  text-decoration: none;
}

a:hover, a:focus {
  color: #6CBDFF;
  text-decoration: underline;
}

h1, h2, h3, h4, h5, h6 {
  color: #ffd5ae;
  font-family: "Courier New", monospace;
}

h1 {
  font-size: 32px;
  text-align: center;
}

h2 {
  color: #f0c79e;
  border-bottom: 1px solid #d27742;
}

p {
  margin: 35px 30px 25px 20px;
}

ol, ul {
  margin: 20px 30px 25px 0;
  padding-left: 25px;
  list-style-position: outside;
}

li {
  text-align: left;
}

blockquote {
  border-left: 3px solid #d87534;
  margin: 15px 0;
  padding: 8px 15px;
  background: #3b2a23;
  color: #e9c29e;
}

pre {
  padding: 10px;
  border: 1px solid #a85831;
  border-radius: 0;

  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  white-space: pre;
}

pre code {
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
}

th, td {
  padding: 6px 10px;
  border: 1px solid #a85831;
}

th {
  background: #82543f;
  color: #ffd5ae;
}

footer {
  width: 100%;
  float: none;
  position: static;
  bottom: auto;

  box-sizing: border-box;
  padding: 20px;
  border-top: 1px solid #d27742;

  text-align: center;
}

footer p {
  margin: 0;
}

@media screen and (max-width: 1050px) {

  .wrapper {
    width: calc(100% - 20px);
  }

}

@media screen and (max-width: 600px) {

  body {
    font-size: 14px;
  }

  header {
    padding: 15px;
  }

  footer p {
    margin: 0;
  }
  section {
    padding: 15px;
  }

}
```

Now you have all three files in one folder: `alice.html`, `bob.html`, and `style.css` (optional). Time to run them.

## Run it

1. From the folder containing the two HTML pages, serve it with the page-1 command: `python3 -m http.server 8000`.
2. Open two windows (or two tabs): `http://localhost:8000/alice.html` and `http://localhost:8000/bob.html`. `localhost` is a secure context, so `crypto.subtle` is available in both. Two windows of the same browser are fine — these pages never touch storage, so the windows share no state.
3. Each page has already generated a key pair and printed its public key as JWK at the top. Copy the whole thing from Alice's window — the complete `{...}` object, braces and all.
4. Paste it into Bob's import box and click **Import Key**. Bob imports the key, derives the shared secret, and prints "Import done".
5. Do the reverse: Bob's public key into Alice's import box. Now both pages hold the same derived AES-GCM key — page 5's proof, this time across two pages.
6. Verify the fingerprint (next section) before exchanging messages.
7. Encrypt on one side, paste the JSON into the other side's decrypt box, read the plaintext.

## Verify the fingerprint first

The import box trusts whatever JWK you paste into it. Before you send a single secret, you want to know the key you imported really is the peer's — the TOFU check promised back on [page 2](02-hashing.html). Both pages ship a hash box for exactly this.

In Bob's window, paste Alice's public key into the hash box and click **Hash it**. You get a 64-character hex fingerprint — SHA-256 of the key via `crypto.subtle.digest` and `toHex`. Now, in Alice's window, paste Alice's *own* public key (the one her page displays) into the hash box and hash it. Same bytes in, same hex out — the fingerprints match, and Bob can be confident the key he imported is the one Alice's page generated.

## Exchange a message

1. In Bob's window, type a message into the encrypt box and click **Encrypt**. The page prints the `{iv, encryptedMessage}` JSON.
2. Copy the entire object — braces and all.
3. In Alice's window, paste it into the decrypt box and click **Decrypt**. The plaintext appears.
4. Send one back: Alice encrypts, Bob decrypts.

Each direction works because both pages derived the same AES key from the same shared secret. The only things that traveled — public keys, IVs, ciphertext — are the only things that *could* travel. The secret never left either browser.

## What you should see

- The public key pre shows compact JWK: `{"kty":"EC","crv":"P-256","x":"...","y":"...","ext":true,"key_ops":[]}` — the page-4 shape, with `ext` still `true` because public keys are always extractable.
- After a successful import: `Import done` — and only then.
- Encrypting `Hello` yields 21 numbers in `encryptedMessage` (5 plaintext bytes + 16 GCM tag bytes). Encrypting the same message again yields *different* numbers, because the IV is fresh every time — page 3, observed in a real page.
- Decrypting the pasted JSON prints the exact message back.

## Troubleshooting

- **Encrypt or decrypt does nothing, and the console shows a `TypeError` about a null value.** You skipped the import step — `symmetricKey` is still `null`. Import the peer's key first; the derivation only runs in the import handler.
- **"Unexpected token" or a `JSON.parse` error on import or decrypt.** The box received something that is not exactly the JSON — a trailing character, a truncated key, or quotes autocorrected to curly quotes. The import box expects the full JWK object; the decrypt box expects the full `{iv, encryptedMessage}` object.
- **Decrypt throws `OperationError`.** GCM authentication failed — wrong key, wrong IV, or ciphertext that changed in transit. Page 3's tamper test is now the error message in a real page: any modification makes decryption refuse.
- **Decrypt fails after reloading one page.** Reloading regenerates that page's key pair, so the other page's imported key is now stale — an old public key against a new secret. Re-import the *current* public key from the reloaded page.
- **`crypto.subtle` is undefined.** You opened the file directly (a `file://` URL) instead of through the local server. Page 1's rule: secure context or nothing.

## Recap

- A real page is console code plus plumbing: helpers wrap the API calls, `main()` holds the state, button handlers connect inputs to outputs.
- The import handler is the whole page-5 derivation in one click: JWK → `deriveBits` → HKDF import → `deriveKey` → `symmetricKey`. Until it runs, nothing else works.
- `salt` and `info` are hardcoded in both files because they are *shared, not secret*; a real app randomizes the salt per session and transmits it with the ciphertext.
- The wire format is `{ iv, encryptedMessage }`: 12 IV bytes plus ciphertext that includes the 16-byte GCM tag. `Array.from()` makes typed arrays JSON-serializable.
- Fingerprints: SHA-256 of the peer's JWK, compared out of band; the avalanche effect makes a swapped key obvious.
- Nothing secret ever leaves the browser — public keys, IVs, and ciphertext are all public by design.

## Hands-on checkpoint

1. Retype the import handler from memory — the four `await`s that turn a pasted JWK into a usable AES key. Check against the page, then explain what `symmetricKey` is before the import and after.
2. Encrypt the same message twice in one page. Predict, then verify: are the two JSON outputs identical? Which field differs, and why?
3. Tamper: change one number in the `encryptedMessage` array before pasting it into the decrypt box. What error appears, and what guarantees it?
4. Fingerprint drill: hash the peer's key in both windows, confirm the match, then flip one character in the key and hash again. Explain to someone how this catches a swapped key.
5. Break the shared parameters: edit `bob.html` so its `info` string differs from Alice's, reload, and re-run the exchange. Decrypt now fails — which parameter caused it, and why does GCM refuse instead of producing garbage? (Page 5.)
6. Explain to someone why the all-zero salt is safe in this demo but would be wrong to hardcode in a real app. Your answer should use the words *shared* and *not secret*.

← [Prev: Deriving a Shared Secret](05-key-agreement.html) · [Next: Practice Exercises →](07-practice-exercises.html)
