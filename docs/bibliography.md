---
layout: default
---
# Annotated Bibliography

---

## 1. React — Official Documentation

**Link:** [https://react.dev/][React]

**Source type:** Primary source. This is the official documentation website for React, maintained by the React core team and open-source contributors. It is the authoritative reference for the library itself, not a secondary source commenting on it.

**Relation to app:** React is a `resource` that will be used in my project. It is the frontend framework for my application. Anything that the user interacts with in the GUI will be a React component. React provides the UI layer that calls the browser's Web Crypto API (entry 10) and manages the chat state around it.

**Description:** React is an open-source JavaScript library, created by [Meta][facebook], for building user interfaces from composable components. The site hosts an interactive tutorial, a full API reference, and in-depth guides covering components, hooks (`useState`, `useEffect`, etc.), rendering behavior, and patterns for integrating with browser APIs. It is the canonical place React developers go to learn the framework.

**Relevance:** The chat frontend depends on React's component model and effect system. Effects handle mounting and unmounting the WebSocket connection (entry 3) and updating message state as ciphertext arrives, without the user leaving the chat view. React's declarative rendering keeps the UI in sync with message history as it is decrypted from IndexedDB on load.

---

## 2. MongoDB — Official Documentation

**Link:** [https://www.mongodb.com/docs/][Mongo]

**Source type:** Primary source. Official documentation published by MongoDB, Inc., the company that develops the database. The docs are the definitive reference for MongoDB's data model and drivers.

**Relation to app:** MongoDB is a `resource` to be used in my project. This database stores user metadata, account credentials (password hashes for auth), and public keys.

**Description:** MongoDB is a document-oriented NoSQL database that stores data as JSON-like documents in collections. The official docs cover the data model, CRUD operations, indexing, aggregation, and the Node.js driver API, along with Atlas (MongoDB's hosted cloud service). The driver documentation is particularly relevant, as it describes how a Node backend connects to and queries the database.

**Relevance:** MongoDB lives server-side and stores user metadata and public keys, which an endpoint fetches when it wants to send an encrypted message to another user. It never stores ciphertext or decryption keys, so a server compromise exposes no message content. The cost of that choice is device-side exposure: the private keys and history that live in the browser (entry 5) are readable by an XSS attacker.

---

## 3. MDN — WebSockets API

**Link:** [https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API][WebSocket]

**Source type:** Primary documentation. MDN Web Docs is operated by Mozilla with a broad open-source contributor community and is the canonical reference for web platform APIs. It documents the WebSocket interface as implemented in browsers; the underlying protocol specification is RFC 6455.

**Relation to app:** WebSockets is a `resource`. It is the main message protocol I will be using. It manages user endpoint connections and delivers ciphertext to a specific user endpoint.

**Description:** This page explains the browser's WebSockets API: how a connection is established through an HTTP upgrade handshake, the `readyState` states a connection moves through, sending and receiving text and binary messages, and the `open`, `message`, `error`, and `close` events. It is the standard reference for using WebSockets in a browser.

**Relevance:** This option was chosen over other messaging protocols because this is a real-time app. The upgrade handshake matters here: polling with a fresh TCP handshake per request is inefficient and adds overhead. WebSockets uses the same ports as HTTP (80 and 443) and coexists with other HTTP connections and proxies. The server is a pure relay: it never sees plaintext, though it does see metadata — who is connected and messaging whom — which my threat model explicitly accepts.

---

## 4. Node.js — Official API Documentation

**Link:** [https://nodejs.org/docs/latest/api/][Node]

**Source type:** Primary source. Official API documentation published by the Node.js project under the OpenJS Foundation. It is the authoritative reference for the Node.js standard library.

**Relation to app:** Node.js is a `resource`. It is the backend for my application. It uses the WebSocket library (entry 6) to establish connections with user endpoints and relays ciphertext between them. In my threat model the server is the adversary by design: it handles auth and holds metadata and public keys, but is structured so it can never read message content.

**Description:** Node.js is a JavaScript runtime built on Google's V8 engine, designed for I/O-heavy, event-driven applications. The API documentation covers the standard library, including the `http` module, `crypto`, `events`, and `streams`, along with the event-loop model that makes Node well suited to long-lived connections.

**Relevance:** Node.js was chosen over other options because its event-driven, non-blocking I/O model fits chat workloads, which are long-lived and connection-heavy. The `ws` library (entry 6) provides the WebSocket server; the app does not rely on Node's built-in WebSocket support. 

---

## 5. MDN — Using IndexedDB

**Link:** [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB][Index]

**Source type:** Primary documentation. Part of MDN Web Docs (Mozilla), the canonical reference for web platform APIs, written and maintained in collaboration with the web standards community.

**Relation to app:** IndexedDB is also a `resource`. It lives on the user's device and stores the ECDH private key, TOFU-pinned peer public keys and fingerprints, and encrypted message history.

**Description:** This guide walks through the IndexedDB API: opening a database, creating object stores, using transactions, adding and retrieving records, and working with indexes. IndexedDB is a transactional, asynchronous, key-value database built into every modern browser, designed for storing significant amounts of structured data client-side.

**Relevance:** Keeping private keys and history client-side protects message content from server compromise, at the cost of device-side exposure: anything stored in IndexedDB is readable by an XSS attacker. That is why the app uses IndexedDB rather than localStorage — it is the browser's structured, transactional storage API and can hold the message history localStorage cannot. Ephemeral keys are stored alongside ciphertext so history can be re-decrypted on load. 

---

## 6. ws — WebSocket Library Documentation

**Link:** [https://github.com/websockets/ws/blob/HEAD/doc/ws.md][ws]

**Source type:** Primary source. This is the official documentation for the `ws` library, maintained in the library's own GitHub repository by the `ws` team. It describes the library from the inside.

**Relation to app:** `ws` is a `resource`. It is the WebSocket library the Node.js backend uses to create the WebSocket server, accept upgrade requests from browser clients, and keep track of connected user endpoints so ciphertext can be routed to the right recipient.

**Description:** `ws` is a lightweight, widely used WebSocket implementation for Node.js. The docs cover creating a `WebSocketServer`, handling the HTTP upgrade handshake, broadcasting to connected clients, ping/pong keepalive frames, and client-side usage. It is the de facto standard WebSocket library in the Node ecosystem, with a minimal API that stays close to the raw protocol.

**Relevance:** The browser's WebSocket API (entry 3) and Node's `ws` server (this entry) are the two halves of the same protocol. `ws` handles the connection lifecycle on the server side, maintains the map of live connections that message routing depends on, and provides ping/pong keepalives so stale connections don't accumulate. Its minimal abstraction keeps the server a pure relay, which matches the threat model. 

---

## 7. Diffie-Hellman — Key Exchange

**Link:** [https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange][Diffie-Hellman Wiki]

**Source type:** Tertiary/encyclopedic reference. A Wikipedia article used as an overview of the key-exchange mechanism and as a map to the primary literature (entries 8, 12, 13, and 16 below).

**Relation to app:** Diffie-Hellman — in its elliptic-curve form, ECDH — is the key-exchange mechanism at the core of my app. Each user generates an ECDH keypair; two users derive the same shared secret from each other's public keys, which then seeds the AES-GCM conversation key. This entry is the conceptual starting point for that mechanism.

**Description:** The Wikipedia article covers the original Diffie-Hellman key exchange: the discrete-logarithm setting, the math by which two parties arrive at a shared secret over an insecure channel, the MITM caveat (unauthenticated DH can be intercepted), and the variants including ECDH.

**Relevance:** Establishes the vocabulary and the attack context (MITM) that motivate my TOFU design and fingerprint comparison. Its reference list also serves as an index to the primary sources cited in the entries below.

---

## 8. Diffie & Hellman — New Directions in Cryptography (1976)

**Link:** [https://ee.stanford.edu/~hellman/publications/24.pdf][DH1976]

**Source type:** Peer-reviewed journal article (primary source). Invited paper in IEEE Transactions on Information Theory, vol. 22, no. 6, November 1976. Free author-hosted copy linked.

**Relation to app:** The origin of the exact mechanism my app uses. This paper introduces public-key cryptography and the two-party key exchange that lets my users establish a shared secret without ever transmitting it — the basis for everything in Phase 0 of my proposal.

**Description:** The foundational paper of asymmetric cryptography. Introduces one-way functions, public/private key pairs, the Diffie-Hellman key exchange for agreeing on a shared secret over an insecure channel, and sketches the idea of digital signatures.

**Relevance:** Every ECDH key agreement in my app is a direct descendant of the scheme in this paper, with the math moved to elliptic curves. Citing the primary source grounds my key-exchange claims in the literature rather than a Wikipedia summary.

---

## 9. Menezes, van Oorschot & Vanstone — Handbook of Applied Cryptography

**Link:** [http://cacr.uwaterloo.ca/hac/][HAC]

**Source type:** Academic textbook/reference (primary source). The authors host the full text free at the University of Waterloo.

**Relation to app:** The reference my analysis will lean on for key-agreement protocols and security definitions — especially Chapter 12 (key establishment) and the security-objectives vocabulary in Chapter 1.

**Description:** The standard graduate reference for applied cryptography, covering symmetric and asymmetric algorithms, key management, key establishment, and authentication with formal definitions and attack models.

**Relevance:** Lets me state precisely the difference between key agreement and key transport, and name the security properties (confidentiality, authentication, forward secrecy) that my analysis of the static-static ECDH scheme needs to discuss.

---

## 10. W3C — Web Cryptography API

**Link:** [https://www.w3.org/TR/WebCryptoAPI/][WebCrypto]

**Source type:** W3C Recommendation (primary standard).

**Relation to app:** The browser API that performs all cryptography in my frontend: generating ECDH keypairs, deriving shared secrets, AES-GCM encrypt/decrypt, and SHA-256 for fingerprints.

**Description:** Specifies the Web Crypto API and its SubtleCrypto interface: the supported algorithms (ECDH, AES-GCM, HKDF, etc.), key types and extractability, and the requirement that crypto functions only run in secure contexts (HTTPS).

**Relevance:** This spec is the constraint set for my implementation. It defines why I use P-256 (algorithm support in SubtleCrypto), why keys are CryptoKey objects, and why the app must be served over HTTPS — all facts the analysis section will rely on.

---

## 11. MDN — SubtleCrypto

**Link:** [https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto][SubtleCrypto]

**Source type:** Primary documentation. MDN Web Docs (Mozilla), the canonical reference for web platform APIs.

**Relation to app:** The practical reference for the exact functions my frontend calls: `generateKey`, `deriveBits`/`deriveKey`, `importKey`, and `exportKey` (e.g., exporting a public key to upload to the server, importing a peer's public key for ECDH).

**Description:** Documents the SubtleCrypto interface with algorithm-specific examples and parameter details.

**Relevance:** The implementation will be written from these examples. It also documents the `extractable`/non-extractable key flags — the decision point for whether private keys can ever be exported out of IndexedDB, which my threat model cares about.

---

## 12. NIST SP 800-56A Rev. 3 — Pair-Wise Key Establishment Using Discrete Logarithm Cryptography

**Link:** [https://csrc.nist.gov/pubs/sp/800/56/a/r3/final][NIST56A]

**Source type:** Government standard (NIST Special Publication).

**Relation to app:** The approved recipe for the ECDH key agreement my app performs — including the key-derivation steps that naive implementations skip (hashing the raw shared secret before use).

**Description:** NIST's recommendation for pair-wise key-establishment schemes based on the discrete-logarithm problem over finite fields and elliptic curves, including several DH variants, with approved curves, public-key validation, and key-derivation requirements.

**Relevance:** If my ECDH derivation follows this spec, the analysis can truthfully claim the scheme is NIST-approved. It also names the classic footgun (using the raw ECDH output directly as a key), which my implementation will deliberately avoid.

---

## 13. RFC 7250 — Using Raw Public Keys in TLS

**Link:** [https://www.rfc-editor.org/rfc/rfc7250][RFC7250]

**Source type:** IETF standards-track Request for Comments (primary standard).

**Relation to app:** A standards-body precedent for my trust model. RFC 7250 lets TLS endpoints authenticate with raw public keys under trust-on-first-use instead of certificates — exactly the model my app uses for peer keys (pin the first key seen, verify fingerprints out-of-band).

**Description:** Specifies the use of raw public keys (without certificates) in TLS for authentication, including the TOFU trust implications of doing so.

**Relevance:** Gives my TOFU choice an authoritative precedent: authentication against pinned raw keys is a legitimate, standardized design. My analysis can cite it as prior art for the trust model.

---

## 14. RFC 4251 — SSH Protocol Architecture

**Link:** [https://www.rfc-editor.org/rfc/rfc4251][RFC4251]

**Source type:** IETF standards-track Request for Comments (primary standard).

**Relation to app:** SSH has used the same TOFU model my app uses — trust the server's host key on first connection, warn if it later changes — in production for over two decades.

**Description:** The architecture document for SSHv2, covering host-key authentication: how host keys are exchanged on first connection and how clients store and verify them afterward.

**Relevance:** Real-world evidence that TOFU is a viable trust model at scale, and the vocabulary (host key, fingerprint) my analysis borrows when comparing my app's key-pinning behavior to a mature protocol.

---

## 15. Marlinspike & Perrin — The X3DH Key Agreement Protocol (2016)

**Link:** [https://signal.org/docs/specifications/x3dh/][X3DH]

**Source type:** Formal protocol specification (Signal Messenger).

**Relation to app:** The industry-standard stronger alternative to my static-static ECDH scheme. My app deliberately implements the simpler scheme; this spec is what the analysis compares against when discussing the forward-secrecy trade-off.

**Description:** Specifies Signal's Extended Triple Diffie-Hellman key agreement: static identity keys, ephemeral keys, and one-time prekeys combined to establish a shared secret with forward secrecy and deniability in an asynchronous setting.

**Relevance:** Gives the "no forward secrecy" critique of my design a concrete, citable reference — including its own discussion of fingerprint-based out-of-band authentication, which is exactly the mechanism my app uses.

---

## 17. Signal — Technical Information

**Link:** [https://signal.org/docs/][Signal]

**Source type:** Primary source. Official technical documentation published by Signal Messenger LLC, the organization that develops the Signal messaging service.

**Relation to app:** Signal is the primary comparable solution against which FRUM is contrasted in the proposal. This page is the official summary of how Signal's servers, clients, and protocol fit together.

**Description:** The Signal technical documentation describes the service's architecture: how the Signal Protocol (X3DH key agreement and the Double Ratchet, entry 16) provides end-to-end encryption, how safety numbers are derived and verified, and how the server is designed to handle only encrypted content and metadata, never plaintext.

**Relevance:** Establishes the reference point for the proposal's comparable-solutions section: the property FRUM shares with Signal (ciphertext-only servers, fingerprint verification) and the properties FRUM deliberately simplifies (static-static ECDH instead of X3DH and the Double Ratchet, no forward secrecy, history stored only client-side).

---

## 18. WhatsApp — Encryption Overview

**Link:** [https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf][WhatsApp]

**Source type:** Primary source. Security whitepaper published by WhatsApp, a service of Meta Platforms, Inc.

**Relation to app:** WhatsApp is the second comparable solution contrasted with FRUM in the proposal. The whitepaper documents the exact encryption mechanisms WhatsApp relies on.

**Description:** The whitepaper describes how WhatsApp implements end-to-end encryption using the Signal Protocol, including key generation, key exchange, session state, and the verification of peers through security codes, and summarizes what information WhatsApp's servers do and do not see.

**Relevance:** Provides the citable basis for the proposal's comparison: WhatsApp and FRUM share end-to-end encryption and peer verification, while differing on openness, identity model (phone numbers), metadata collection, and where message history is stored.

---

[facebook]: https://www.meta.com/about/
[React]: https://react.dev/
[Mongo]: https://www.mongodb.com/docs/
[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
[Node]: https://nodejs.org/docs/latest/api/
[Index]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
[ws]: https://github.com/websockets/ws/blob/HEAD/doc/ws.md
[Diffie-Hellman Wiki]: https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange
[DH1976]: https://ee.stanford.edu/~hellman/publications/24.pdf
[HAC]: http://cacr.uwaterloo.ca/hac/
[WebCrypto]: https://www.w3.org/TR/WebCryptoAPI/
[SubtleCrypto]: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
[NIST56A]: https://csrc.nist.gov/pubs/sp/800/56/a/r3/final
[RFC7250]: https://www.rfc-editor.org/rfc/rfc7250
[RFC4251]: https://www.rfc-editor.org/rfc/rfc4251
[X3DH]: https://signal.org/docs/specifications/x3dh/
[Signal]: https://signal.org/docs/
[WhatsApp]: https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf
